import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaInstagram, FaChevronDown, FaBell } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';
import api from '../services/api';
import './Layout.css';

// ── LocalStorage helpers ──
function getLsKey(userId) { return `notif_leidas_${userId}`; }
function getLeidas(userId) {
  try { return new Set(JSON.parse(localStorage.getItem(getLsKey(userId)) || '[]')); }
  catch { return new Set(); }
}
function marcarLeida(id, userId) {
  const leidas = getLeidas(userId);
  leidas.add(id);
  localStorage.setItem(getLsKey(userId), JSON.stringify([...leidas]));
}

// ── Formatea fecha/hora ──
function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── Modal de confirmación homogéneo ──
function ModalUnificado({ visible, icono, titulo, descripcion, acciones, onClose }) {
  if (!visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        {icono && <div className="modal-icono">{icono}</div>}
        <h2 className="modal-titulo">{titulo}</h2>
        {descripcion && <p className="modal-descripcion">{descripcion}</p>}
        <div className="modal-acciones">
          {acciones}
        </div>
      </div>
    </div>
  );
}

// ── Modal detalle nueva solicitud para proveedor ──
function NotifProveedorDetalle({ notif, onCerrar, onIrChat }) {
  if (!notif) return null;
  const formatFechaEvento = (f) => {
    if (!f) return null;
    try {
      return new Date(f).toLocaleDateString('es-MX', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });
    } catch { return f; }
  };
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card modal-card--ancho" onClick={e => e.stopPropagation()}>
        <div className="modal-icono">&#x1F4CB;</div>
        <h2 className="modal-titulo">Nueva solicitud de cotización</h2>
        <div className="notif-prov-info">
          {notif.tipo_evento && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">&#x1F389; Tipo de evento</span>
              <span>{notif.tipo_evento}</span>
            </div>
          )}
          {notif.fecha_evento && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">&#x1F4C5; Fecha del evento</span>
              <span>{formatFechaEvento(notif.fecha_evento)}</span>
            </div>
          )}
          {notif.cliente_nombre && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">&#x1F464; Cliente</span>
              <span>{notif.cliente_nombre}</span>
            </div>
          )}
          {notif.numero_invitados && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">&#x1F465; Invitados</span>
              <span>{notif.numero_invitados}</span>
            </div>
          )}
          {notif.presupuesto_estimado && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">&#x1F4B0; Presupuesto estimado</span>
              <span>${Number(notif.presupuesto_estimado).toLocaleString('es-MX')}</span>
            </div>
          )}
          {notif.descripcion_solicitud && (
            <div className="notif-admin-row notif-admin-row--bloque">
              <span className="notif-admin-label">&#x1F4DD; Detalles adicionales</span>
              <span>{notif.descripcion_solicitud}</span>
            </div>
          )}
          <div className="notif-admin-row">
            <span className="notif-admin-label">&#x23F0; Recibida</span>
            <span>{formatFecha(notif.fecha_recepcion)}</span>
          </div>
        </div>
        <div className="modal-acciones">
          <button
            className="modal-btn modal-btn--accion"
            onClick={() => { onCerrar(); onIrChat(notif.id_solicitud); }}
          >
            &#x1F4AC; Ir al Chat
          </button>
          <button className="modal-btn modal-btn--secundario" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Layout({ children, showNav = true }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [modalContacto, setModalContacto] = useState(false);
  const dropdownRef = useRef(null);

  const NOTIF_POR_PAGINA = 3;
  const userIdGral = user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador ?? user?.id;

  // ── Notificaciones CLIENTE ──
  const [notificacionesCliente, setNotificacionesCliente] = useState([]);
  const [showNotifCliente, setShowNotifCliente] = useState(false);
  const [noLeidasCliente, setNoLeidasCliente] = useState(0);
  const notifClienteRef = useRef(null);
  const [notifClienteDetalle, setNotifClienteDetalle] = useState(null);
  const [paginaCliente, setPaginaCliente] = useState(0);

  // ── Notificaciones PROVEEDOR ──
  const [notificacionesProveedor, setNotificacionesProveedor] = useState([]);
  const [showNotifProveedor, setShowNotifProveedor] = useState(false);
  const [noLeidasProveedor, setNoLeidasProveedor] = useState(0);
  const notifProveedorRef = useRef(null);
  const [paginaProveedor, setPaginaProveedor] = useState(0);
  const [notifAdminGralDetalle, setNotifAdminGralDetalle] = useState(null);
  const [notifSolicDetalle, setNotifSolicDetalle] = useState(null);

  // ── Notificaciones ADMIN ──
  const [notifAdmin, setNotifAdmin] = useState([]);
  const [noLeidasAdmin, setNoLeidasAdmin] = useState(0);
  const [showNotifAdmin, setShowNotifAdmin] = useState(false);
  const [paginaAdmin, setPaginaAdmin] = useState(0);
  const notifAdminRef = useRef(null);
  const [notifAdminDetalle, setNotifAdminDetalle] = useState(null);

  const hideAuthButtons =
    location.pathname === '/login' ||
    location.pathname === '/login-proveedor' ||
    location.pathname === '/register' ||
    location.pathname === '/register-proveedor';

  const handleLogout = () => { logout(); navigate('/'); };
  const handleLogoutAdmin = () => { logout(); navigate('/login-proveedor', { replace: true }); };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Conectar socket ──
  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (token && !socketService.socket?.connected) {
      socketService.connect(token);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (notifClienteRef.current && !notifClienteRef.current.contains(event.target)) setShowNotifCliente(false);
      if (notifProveedorRef.current && !notifProveedorRef.current.contains(event.target)) setShowNotifProveedor(false);
      if (notifAdminRef.current && !notifAdminRef.current.contains(event.target)) setShowNotifAdmin(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Recálculo manual de no leídas ──
  const forzarRecalculoCliente = (lista) => {
    const leidas = getLeidas(userIdGral);
    setNoLeidasCliente(lista.filter(n => !leidas.has(n.id_notificacion)).length);
  };
  const forzarRecalculoProveedor = (lista) => {
    const leidas = getLeidas(userIdGral);
    setNoLeidasProveedor(lista.filter(n => !leidas.has(n.id_notificacion || n.id)).length);
  };
  const forzarRecalculoAdmin = (lista) => {
    const currentAdminId = user?.id_administrador ?? user?.id;
    const leidas = getLeidas('admin_' + currentAdminId);
    setNoLeidasAdmin(lista.filter(n => !leidas.has(n.id)).length);
  };

  // ── Cargar notificaciones BD (Cliente / Proveedor) ──
  useEffect(() => {
    if (!user || user.rol === 'admin') return;
    api.get(`/admin/notificaciones?rol=${user.rol}`)
      .then(res => {
        if (res.data.success) {
          const leidas = getLeidas(userIdGral);
          if (user.rol === 'cliente') {
            setNotificacionesCliente(res.data.data);
            setNoLeidasCliente(res.data.data.filter(n => !leidas.has(n.id_notificacion)).length);
          } else if (user.rol === 'proveedor') {
            setNotificacionesProveedor(res.data.data);
            setNoLeidasProveedor(res.data.data.filter(n => !leidas.has(n.id_notificacion || n.id)).length);
          }
        }
      })
      .catch(() => {});
  }, [user, userIdGral]);

  // ── Sockets en tiempo real (Cliente / Proveedor) ──
  useEffect(() => {
    if (!user || user.rol === 'admin') return;

    const onNuevaNotifGral = (notif) => {
      const leidas = getLeidas(userIdGral);
      if (user.rol === 'cliente') {
        setNotificacionesCliente(prev => {
          const nueva = [notif, ...prev];
          setNoLeidasCliente(nueva.filter(n => !leidas.has(n.id_notificacion)).length);
          return nueva;
        });
      } else if (user.rol === 'proveedor') {
        setNotificacionesProveedor(prev => {
          const nueva = [notif, ...prev];
          setNoLeidasProveedor(nueva.filter(n => !leidas.has(n.id_notificacion || n.id)).length);
          return nueva;
        });
      }
    };

    const onNuevaSolicitudCotizacion = (data) => {
      console.log('[Layout] nueva_solicitud recibida:', data);
      if (user.rol !== 'proveedor') return;
      const leidas = getLeidas(userIdGral);
      const notifMapeada = {
        ...data,
        id: 'solic_' + data.id_solicitud + '_' + Date.now(),
        esCotizacion: true,
        fecha_recepcion: data.fecha_recepcion || new Date().toISOString(),
      };
      setNotificacionesProveedor(prev => {
        const nueva = [notifMapeada, ...prev];
        setNoLeidasProveedor(nueva.filter(n => !leidas.has(n.id_notificacion || n.id)).length);
        return nueva;
      });
    };

    socketService.addPersistentListener('nueva_notificacion', onNuevaNotifGral);
    if (user.rol === 'cliente') {
      socketService.addPersistentListener('nueva_notificacion_cliente', onNuevaNotifGral);
    } else if (user.rol === 'proveedor') {
      socketService.addPersistentListener('nueva_notificacion_proveedor', onNuevaNotifGral);
      socketService.addPersistentListener('nueva_solicitud', onNuevaSolicitudCotizacion);
    }

    return () => {
      socketService.removePersistentListener('nueva_notificacion', onNuevaNotifGral);
      socketService.removePersistentListener('nueva_notificacion_cliente', onNuevaNotifGral);
      socketService.removePersistentListener('nueva_notificacion_proveedor', onNuevaNotifGral);
      socketService.removePersistentListener('nueva_solicitud', onNuevaSolicitudCotizacion);
    };
  }, [user, userIdGral]);

  // ── Cargar historial Admin ──
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;
    const currentAdminId = user?.id_administrador ?? user?.id;

    const cargarNotifAdmin = async () => {
      try {
        const [resProv, resResenas] = await Promise.all([
          api.get('/admin/solicitudes-proveedores'),
          api.get('/admin/resenas'),
        ]);

        const notifsProv = resProv.data.success
          ? resProv.data.data.map(p => ({
              tipo: 'nuevo_proveedor',
              id: 'prov_' + p.id_proveedor,
              id_proveedor: p.id_proveedor,
              nombre_negocio: p.nombre_negocio,
              correo: p.correo,
              telefono: p.telefono,
              ciudad: p.ciudad,
              tipo_servicio: p.tipo_servicio,
              fecha_registro: p.fecha_registro,
              // ✅ fecha_recepcion = fecha_registro (cuándo se registró el proveedor)
              fecha_recepcion: p.fecha_registro,
            }))
          : [];

        const notifsResenas = resResenas.data.success
          ? resResenas.data.data.map(r => ({
              tipo: 'resena_reportada',
              id: 'res_' + r.id_resena,
              id_resena: r.id_resena,
              motivo: r.motivo_reporte,
              comentario: r.comentario,
              calificacion: r.calificacion,
              sentimiento: r.sentimiento,
              nombre_negocio: r.nombre_negocio,
              nombre_cliente: r.nombre_cliente,
              fecha_publicacion: r.fecha_publicacion,
              // ✅ fecha_recepcion = fecha_publicacion (cuándo fue reportada)
              fecha_recepcion: r.fecha_publicacion,
            }))
          : [];

        const todas = [
          ...notifsResenas,
          ...notifsProv.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)),
        ];

        const leidas = getLeidas('admin_' + currentAdminId);
        setNotifAdmin(todas);
        setNoLeidasAdmin(todas.filter(n => !leidas.has(n.id)).length);
      } catch (e) {
        console.error('Error cargando notificaciones admin:', e);
      }
    };
    cargarNotifAdmin();
  }, [user]);

  // ── Sockets Admin ──
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;
    const currentAdminId = user?.id_administrador ?? user?.id;

    const registrar = (socket) => {
      const onNuevaSolicitudProv = (data) => {
        const leidas = getLeidas('admin_' + currentAdminId);
        const notif = {
          ...data,
          id: 'prov_' + data.id_proveedor + '_rt_' + Date.now(),
          tipo: 'nuevo_proveedor',
          // ✅ Hora real en que llega el evento (= momento del registro)
          fecha_recepcion: data.fecha_registro || new Date().toISOString(),
        };
        setNotifAdmin(prev => {
          if (prev.some(n => n.id_proveedor === data.id_proveedor && n.tipo === 'nuevo_proveedor')) return prev;
          const nueva = [notif, ...prev];
          setNoLeidasAdmin(nueva.filter(n => !leidas.has(n.id)).length);
          return nueva;
        });
      };

      const onResenaReportada = (data) => {
        const leidas = getLeidas('admin_' + currentAdminId);
        const notif = {
          ...data,
          id: 'res_' + data.id_resena + '_rt_' + Date.now(),
          tipo: 'resena_reportada',
          // ✅ Hora real en que llega el evento (= momento del reporte)
          fecha_recepcion: new Date().toISOString(),
        };
        setNotifAdmin(prev => {
          if (prev.some(n => n.id_resena === data.id_resena && n.tipo === 'resena_reportada')) return prev;
          const nueva = [notif, ...prev];
          setNoLeidasAdmin(nueva.filter(n => !leidas.has(n.id)).length);
          return nueva;
        });
      };

      socket.on('admin_nueva_solicitud_proveedor', onNuevaSolicitudProv);
      socket.on('admin_resena_reportada', onResenaReportada);

      return () => {
        socket.off('admin_nueva_solicitud_proveedor', onNuevaSolicitudProv);
        socket.off('admin_resena_reportada', onResenaReportada);
      };
    };

    const socket = socketService.socket;
    let cleanup = () => {};

    if (socket?.connected) {
      cleanup = registrar(socket);
    } else if (socket) {
      const onConnect = () => { cleanup = registrar(socket); };
      socket.once('connect', onConnect);
      cleanup = () => socket.off('connect', onConnect);
    }

    return () => cleanup();
  }, [user]);

  // ════════════════════════════════
  //  RENDERERS – Panel Global
  // ════════════════════════════════

  const renderPanel = ({ items, pagina, setPagina, keyId, getTitulo, getPreview, getFechaRecepcion, onAbrir, leidasKey }) => {
    const leidas = getLeidas(leidasKey);
    const totalPaginas = Math.ceil(items.length / NOTIF_POR_PAGINA);
    const paginadas = items.slice(pagina * NOTIF_POR_PAGINA, (pagina + 1) * NOTIF_POR_PAGINA);
    return (
      <div className="nav-notif-panel">
        <div className="nav-notif-header">
          <span>🔔 Notificaciones</span>
          {totalPaginas > 1 && <span className="nav-notif-pagina-label">{pagina + 1} / {totalPaginas}</span>}
        </div>
        {items.length === 0 ? (
          <div className="nav-notif-empty">Sin notificaciones</div>
        ) : (
          <>
            <ul className="nav-notif-list">
              {paginadas.map(n => {
                const esLeida = leidas.has(keyId(n));
                return (
                  <li
                    key={keyId(n)}
                    className={`nav-notif-item${esLeida ? ' nav-notif-item--leida' : ''}`}
                    onClick={() => onAbrir(n)}
                    role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && onAbrir(n)}
                  >
                    {!esLeida && <span className="nav-notif-dot" />}
                    <span className="nav-notif-titulo">{getTitulo(n)}</span>
                    <span className="nav-notif-preview">{getPreview(n)}</span>
                    <span className="nav-notif-fecha">{formatFecha(getFechaRecepcion(n))}</span>
                  </li>
                );
              })}
            </ul>
            {totalPaginas > 1 && (
              <div className="nav-notif-paginacion">
                <button className="nav-notif-pag-btn" onClick={() => setPagina(p => p - 1)} disabled={pagina === 0}>‹ Anterior</button>
                <button className="nav-notif-pag-btn" onClick={() => setPagina(p => p + 1)} disabled={pagina >= totalPaginas - 1}>Siguiente ›</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Campana Cliente
  const renderCampanaCliente = () => renderPanel({
    items: notificacionesCliente,
    pagina: paginaCliente,
    setPagina: setPaginaCliente,
    leidasKey: userIdGral,
    keyId: n => n.id_notificacion,
    getTitulo: n => n.titulo,
    getPreview: n => n.mensaje?.length > 60 ? n.mensaje.slice(0, 60) + '…' : n.mensaje,
    getFechaRecepcion: n => n.fecha_envio,
    onAbrir: (n) => {
      marcarLeida(n.id_notificacion, userIdGral);
      setNotifClienteDetalle(n);
      setShowNotifCliente(false);
      forzarRecalculoCliente(notificacionesCliente);
    }
  });

  // Campana Proveedor
  const renderCampanaProveedor = () => renderPanel({
    items: notificacionesProveedor,
    pagina: paginaProveedor,
    setPagina: setPaginaProveedor,
    leidasKey: userIdGral,
    keyId: n => n.id_notificacion || n.id,
    getTitulo: n => n.esCotizacion ? '📋 Nueva cotización' : (n.titulo || '🔔 Aviso de Admin'),
    getPreview: n => n.esCotizacion
      ? [
          n.tipo_evento,
          n.fecha_evento && new Date(n.fecha_evento).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
        ].filter(Boolean).join(' · ') || 'Nueva solicitud recibida'
      : (n.mensaje?.length > 60 ? n.mensaje.slice(0, 60) + '…' : n.mensaje),
    getFechaRecepcion: n => n.fecha_recepcion || n.fecha_envio,
    onAbrir: (n) => {
      marcarLeida(n.id_notificacion || n.id, userIdGral);
      setShowNotifProveedor(false);
      if (n.esCotizacion) {
        setNotifSolicDetalle(n);
      } else {
        setNotifAdminGralDetalle(n);
      }
      forzarRecalculoProveedor(notificacionesProveedor);
    }
  });

  // Campana Admin
  const renderCampanaAdminPanel = () => renderPanel({
    items: notifAdmin,
    pagina: paginaAdmin,
    setPagina: setPaginaAdmin,
    leidasKey: 'admin_' + (user?.id_administrador ?? user?.id),
    keyId: n => n.id,
    getTitulo: n => n.tipo === 'nuevo_proveedor' ? '🏪 Nuevo proveedor' : '⚠️ Reseña reportada',
    getPreview: n => n.tipo === 'nuevo_proveedor' ? n.nombre_negocio : (n.comentario?.length > 60 ? n.comentario.slice(0, 60) + '…' : n.comentario),
    getFechaRecepcion: n => n.fecha_recepcion,
    onAbrir: (n) => {
      const currentAdminId = user?.id_administrador ?? user?.id;
      marcarLeida(n.id, 'admin_' + currentAdminId);
      setNotifAdminDetalle(n);
      setShowNotifAdmin(false);
      forzarRecalculoAdmin(notifAdmin);
    }
  });

  return (
    <div className="layout">
      {showNav && (
        <nav className="navbar">
          <div className="navbar-content">
            <Link to={user?.rol === 'admin' ? '/admin/usuarios' : '/'} className="logo">EventosMX</Link>

            {/* NAVBAR CLIENTE */}
            {user && user.rol === 'cliente' && (
              <div className="nav-links">
                {!isMobile && (
                  <>
                    <Link to="/chat">Chat</Link>
                    <Link to="/cliente/explorar">Explorar Servicios</Link>
                    <Link to="/cliente/listas">Mis eventos</Link>
                  </>
                )}
                <div className="nav-notif-wrapper" ref={notifClienteRef}>
                  <button className="nav-notif-btn" onClick={() => { setShowNotifCliente(p => !p); setShowDropdown(false); }}>
                    <FaBell size={18} />
                    {noLeidasCliente > 0 && <span className="nav-notif-badge">{noLeidasCliente > 9 ? '9+' : noLeidasCliente}</span>}
                  </button>
                  {showNotifCliente && renderCampanaCliente()}
                </div>
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button className="nav-dropdown-trigger" onClick={() => setShowDropdown(prev => !prev)}>
                    Mi cuenta <FaChevronDown size={12} />
                  </button>
                  {showDropdown && (
                    <div className="nav-dropdown-menu">
                      {isMobile && (
                        <>
                          <Link to="/chat" className="dropdown-item" onClick={() => setShowDropdown(false)}>Chat</Link>
                          <Link to="/cliente/explorar" className="dropdown-item" onClick={() => setShowDropdown(false)}>Explorar Servicios</Link>
                          <Link to="/cliente/listas" className="dropdown-item" onClick={() => setShowDropdown(false)}>Mis eventos</Link>
                        </>
                      )}
                      <Link to="/cliente/cuenta/datos" className="dropdown-item" onClick={() => setShowDropdown(false)}>Mi información</Link>
                      <button onClick={handleLogout} className="dropdown-item dropdown-logout">Cerrar sesión</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NAVBAR PROVEEDOR */}
            {user && user.rol === 'proveedor' && (
              <div className="nav-links">
                {!isMobile && (
                  <>
                    <Link to="/chat">Chat</Link>
                    <Link to="/proveedor/cuenta/solicitudes">Solicitudes</Link>
                  </>
                )}
                <div className="nav-notif-wrapper" ref={notifProveedorRef}>
                  <button className="nav-notif-btn" onClick={() => { setShowNotifProveedor(p => !p); setShowDropdown(false); }}>
                    <FaBell size={18} />
                    {noLeidasProveedor > 0 && <span className="nav-notif-badge">{noLeidasProveedor > 9 ? '9+' : noLeidasProveedor}</span>}
                  </button>
                  {showNotifProveedor && renderCampanaProveedor()}
                </div>
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button className="nav-dropdown-trigger" onClick={() => setShowDropdown(prev => !prev)}>
                    Mi cuenta <FaChevronDown size={12} />
                  </button>
                  {showDropdown && (
                    <div className="nav-dropdown-menu">
                      {isMobile && (
                        <>
                          <Link to="/chat" className="dropdown-item" onClick={() => setShowDropdown(false)}>Chat</Link>
                          <Link to="/proveedor/cuenta/solicitudes" className="dropdown-item" onClick={() => setShowDropdown(false)}>Solicitudes</Link>
                        </>
                      )}
                      <Link to="/proveedor/cuenta/informacion" className="dropdown-item" onClick={() => setShowDropdown(false)}>Mi información</Link>
                      <button onClick={handleLogout} className="dropdown-item dropdown-logout">Cerrar sesión</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NAVBAR ADMIN */}
            {user && user.rol === 'admin' && (
              <div className="nav-links">
                {!isMobile && <span className="nav-admin-badge">Administrador</span>}
                <div className="nav-notif-wrapper" ref={notifAdminRef}>
                  <button className="nav-notif-btn" onClick={() => { setShowNotifAdmin(p => !p); setShowDropdown(false); }}>
                    <FaBell size={18} />
                    {noLeidasAdmin > 0 && <span className="nav-notif-badge">{noLeidasAdmin > 9 ? '9+' : noLeidasAdmin}</span>}
                  </button>
                  {showNotifAdmin && renderCampanaAdminPanel()}
                </div>
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button className="nav-dropdown-trigger" onClick={() => setShowDropdown(prev => !prev)}>
                    {user.nombre} <FaChevronDown size={12} />
                  </button>
                  {showDropdown && (
                    <div className="nav-dropdown-menu">
                      <button onClick={handleLogoutAdmin} className="dropdown-item dropdown-logout">Cerrar sesión</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!user && !hideAuthButtons && (
              <div className="nav-links">
                <Link to="/login">Iniciar Sesión</Link>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className="main-content">{children}</main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <Link to="/about">¿Quiénes somos?</Link>
            <Link to="/register-proveedor">Registro de Profesionales</Link>
            <Link to="/terms">Condiciones del servicio</Link>
            <Link to="/privacidad">Aviso de Privacidad</Link>
            <button className="footer-link-btn" onClick={() => setModalContacto(true)}>Contáctanos</button>
          </div>
          <div className="footer-bottom">
            <div className="footer-brand">EventosMX</div>
            <div className="footer-social">
              <button aria-label="Twitter" className="footer-social-btn"><FaTwitter /></button>
              <button aria-label="Facebook" className="footer-social-btn"><FaFacebook /></button>
              <button aria-label="Instagram" className="footer-social-btn"><FaInstagram /></button>
            </div>
          </div>
          <div className="footer-copyright">2026. Todos los derechos reservados</div>
        </div>
      </footer>

      {/* ═══════════ MODALES ═══════════ */}

      {/* Contáctanos */}
      <ModalUnificado
        visible={modalContacto}
        icono="✉️"
        titulo="Contáctanos"
        descripcion={null}
        onClose={() => setModalContacto(false)}
        acciones={
          <>
            <div className="modal-contacto-body">
              <p className="modal-descripcion">Para comunicarte con el administrador, envíanos un correo a:</p>
              <a className="modal-email-link" href="https://mail.google.com/mail/?view=cm&fs=1&to=admin@eventosmx.com" target="_blank" rel="noopener noreferrer">
                admin@eventosmx.com
              </a>
              <p className="modal-nota">Nos pondremos en contacto contigo a la brevedad posible.</p>
            </div>
            <button className="modal-btn modal-btn--primario" onClick={() => setModalContacto(false)}>Cerrar</button>
          </>
        }
      />

      {/* Detalle notificación Cliente */}
      {notifClienteDetalle && (
        <ModalUnificado
          visible={true}
          icono="🔔"
          titulo={notifClienteDetalle.titulo}
          descripcion={null}
          onClose={() => setNotifClienteDetalle(null)}
          acciones={
            <>
              <div className="modal-notif-body">
                <p className="notif-detalle-mensaje">{notifClienteDetalle.mensaje}</p>
                <span className="notif-detalle-fecha">{formatFecha(notifClienteDetalle.fecha_envio)}</span>
              </div>
              <button className="modal-btn modal-btn--primario" onClick={() => setNotifClienteDetalle(null)}>Cerrar</button>
            </>
          }
        />
      )}

      {/* Detalle notificación general Admin para PROVEEDOR */}
      {notifAdminGralDetalle && (
        <ModalUnificado
          visible={true}
          icono="🔔"
          titulo={notifAdminGralDetalle.titulo}
          descripcion={null}
          onClose={() => setNotifAdminGralDetalle(null)}
          acciones={
            <>
              <div className="modal-notif-body">
                <p className="notif-detalle-mensaje">{notifAdminGralDetalle.mensaje}</p>
                <span className="notif-detalle-fecha">{formatFecha(notifAdminGralDetalle.fecha_envio)}</span>
              </div>
              <button className="modal-btn modal-btn--primario" onClick={() => setNotifAdminGralDetalle(null)}>Cerrar</button>
            </>
          }
        />
      )}

      {/* Detalle notificación Admin (panel del administrador) */}
      {notifAdminDetalle && (() => {
        const n = notifAdminDetalle;
        const esProveedor = n.tipo === 'nuevo_proveedor';
        return (
          <div className="modal-overlay" onClick={() => setNotifAdminDetalle(null)}>
            <div className="modal-card modal-card--ancho" onClick={e => e.stopPropagation()}>
              <div className="modal-icono">{esProveedor ? '🏪' : '⚠️'}</div>
              <h2 className="modal-titulo">{esProveedor ? 'Nuevo proveedor registrado' : 'Reseña reportada'}</h2>
              <div className="notif-admin-info">
                {esProveedor ? (
                  <>
                    <div className="notif-admin-row"><span className="notif-admin-label">Negocio</span><span>{n.nombre_negocio}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Correo</span><span>{n.correo}</span></div>
                    {n.telefono && <div className="notif-admin-row"><span className="notif-admin-label">Teléfono</span><span>{n.telefono}</span></div>}
                    {n.ciudad && <div className="notif-admin-row"><span className="notif-admin-label">Ciudad</span><span>{n.ciudad}</span></div>}
                    <div className="notif-admin-row"><span className="notif-admin-label">Tipo de servicio</span><span>{n.tipo_servicio}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Fecha de registro</span><span>{formatFecha(n.fecha_registro)}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Aviso recibido</span><span>{formatFecha(n.fecha_recepcion)}</span></div>
                  </>
                ) : (
                  <>
                    <div className="notif-admin-row"><span className="notif-admin-label">Motivo del reporte</span><span>{n.motivo}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Comentario</span><span>{n.comentario}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Calificación</span><span>{'⭐'.repeat(Math.round(n.calificacion || 0))} ({n.calificacion})</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Sentimiento</span><span>{n.sentimiento}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Publicada</span><span>{formatFecha(n.fecha_publicacion)}</span></div>
                    <div className="notif-admin-row"><span className="notif-admin-label">Aviso recibido</span><span>{formatFecha(n.fecha_recepcion)}</span></div>
                  </>
                )}
              </div>
              <div className="modal-acciones">
                <button className="modal-btn modal-btn--accion" onClick={() => { setNotifAdminDetalle(null); navigate(esProveedor ? '/admin/solicitudes' : '/admin/resenas'); }}>
                  {esProveedor ? 'Ver solicitud del proveedor' : 'Ver reseñas reportadas'}
                </button>
                <button className="modal-btn modal-btn--secundario" onClick={() => setNotifAdminDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal nueva cotización (proveedor) */}
      <NotifProveedorDetalle
        notif={notifSolicDetalle}
        onCerrar={() => setNotifSolicDetalle(null)}
        onIrChat={(id) => navigate(`/chat/${id}`)}
      />
    </div>
  );
}

export default Layout;