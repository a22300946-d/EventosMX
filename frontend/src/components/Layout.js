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

// ── Fecha: SIEMPRE muestra la fecha real de recepción ──
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

// ── Notificación de proveedor (nueva solicitud/cotización) ──
function NotifProveedorDetalle({ notif, onCerrar, onIrChat }) {
  if (!notif) return null;
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card modal-card--ancho" onClick={e => e.stopPropagation()}>
        <div className="modal-icono">📋</div>
        <h2 className="modal-titulo">Nueva solicitud de cotización</h2>
        <div className="notif-prov-info">
          {notif.tipo_evento && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">Tipo de evento</span>
              <span>{notif.tipo_evento}</span>
            </div>
          )}
          {notif.fecha_evento && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">Fecha del evento</span>
              <span>{new Date(notif.fecha_evento).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            </div>
          )}
          <div className="notif-admin-row">
            <span className="notif-admin-label">Recibida</span>
            <span>{formatFecha(notif.fecha_recepcion)}</span>
          </div>
          {notif.mensaje && (
            <div className="notif-admin-row">
              <span className="notif-admin-label">Mensaje</span>
              <span>{notif.mensaje}</span>
            </div>
          )}
        </div>
        <div className="modal-acciones">
          <button
            className="modal-btn modal-btn--accion"
            onClick={() => { onCerrar(); onIrChat(notif.id_solicitud); }}
          >
            💬 Ir al Chat
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

  // ── Notificaciones cliente/proveedor (del admin) ──
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const notifRef = useRef(null);
  const [notifDetalle, setNotifDetalle] = useState(null);
  const NOTIF_POR_PAGINA = 3;
  const [paginaNotif, setPaginaNotif] = useState(0);

  // ── Notificaciones del Admin ──
  const [notifAdmin, setNotifAdmin] = useState([]);
  const [noLeidasAdmin, setNoLeidasAdmin] = useState(0);
  const [showNotifAdmin, setShowNotifAdmin] = useState(false);
  const [paginaAdmin, setPaginaAdmin] = useState(0);
  const notifAdminRef = useRef(null);
  const [notifAdminDetalle, setNotifAdminDetalle] = useState(null);

  // ── Notificaciones de nuevas solicitudes (proveedor) ──
  const [notifSolicitudes, setNotifSolicitudes] = useState([]);
  const [noLeidasSolicitudes, setNoLeidasSolicitudes] = useState(0);
  const [showNotifSolicitudes, setShowNotifSolicitudes] = useState(false);
  const [paginaSolicitudes, setPaginaSolicitudes] = useState(0);
  const notifSolicRef = useRef(null);
  const [notifSolicDetalle, setNotifSolicDetalle] = useState(null);

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

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('token');
    if (token && !socketService.socket?.connected) {
      socketService.connect(token);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target))
        setShowNotif(false);
      if (notifAdminRef.current && !notifAdminRef.current.contains(event.target))
        setShowNotifAdmin(false);
      if (notifSolicRef.current && !notifSolicRef.current.contains(event.target))
        setShowNotifSolicitudes(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Recalcular no-leídas generales ──
  const recalcularNoLeidas = (lista) => {
    const leidas = getLeidas(user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador);
    setNoLeidas(lista.filter(n => !leidas.has(n.id_notificacion)).length);
  };

  // ── Recalcular no-leídas admin ──
  const recalcularNoLeidasAdmin = (lista) => {
    const leidas = getLeidas('admin_' + (user?.id_administrador ?? user?.id));
    setNoLeidasAdmin(lista.filter(n => !leidas.has(n.id)).length);
  };

  // ── Recalcular no-leídas solicitudes (proveedor) ──
  const recalcularNoLeidasSolicitudes = (lista) => {
    const leidas = getLeidas('solic_' + (user?.id_proveedor ?? user?.id));
    setNoLeidasSolicitudes(lista.filter(n => !leidas.has(n.id)).length);
  };

  // ── Cargar notificaciones generales (cliente/proveedor) ──
  useEffect(() => {
    if (!user || user.rol === 'admin') return;
    api.get(`/admin/notificaciones?rol=${user.rol}`)
      .then(res => {
        if (res.data.success) {
          setNotificaciones(res.data.data);
          recalcularNoLeidas(res.data.data);
        }
      })
      .catch(() => {});
  }, [user]);

  // ── Escuchar notificaciones generales en tiempo real ──
  useEffect(() => {
    if (!user || user.rol === 'admin') return;
    const agregarNotif = (notif) => {
      setNotificaciones(prev => {
        const nueva = [notif, ...prev];
        recalcularNoLeidas(nueva);
        return nueva;
      });
    };
    if (socketService.socket) {
      socketService.socket.on('nueva_notificacion', agregarNotif);
      if (user.rol === 'cliente')
        socketService.socket.on('nueva_notificacion_cliente', agregarNotif);
      else if (user.rol === 'proveedor')
        socketService.socket.on('nueva_notificacion_proveedor', agregarNotif);
    }
    return () => {
      if (socketService.socket) {
        socketService.socket.off('nueva_notificacion', agregarNotif);
        socketService.socket.off('nueva_notificacion_cliente', agregarNotif);
        socketService.socket.off('nueva_notificacion_proveedor', agregarNotif);
      }
    };
  }, [user]);

  // ── Escuchar nueva_solicitud para proveedor (nueva cotización) ──
  useEffect(() => {
    if (!user || user.rol !== 'proveedor') return;
    const onNuevaSolicitud = (data) => {
      const notif = {
        ...data,
        id: 'solic_' + data.id_solicitud + '_' + Date.now(),
        fecha_recepcion: new Date().toISOString(),
      };
      setNotifSolicitudes(prev => {
        const nueva = [notif, ...prev];
        recalcularNoLeidasSolicitudes(nueva);
        return nueva;
      });
    };
    const registrar = () => {
      if (socketService.socket)
        socketService.socket.on('nueva_solicitud', onNuevaSolicitud);
    };
    registrar();
    if (socketService.socket)
      socketService.socket.on('connect', registrar);
    return () => {
      if (socketService.socket) {
        socketService.socket.off('nueva_solicitud', onNuevaSolicitud);
        socketService.socket.off('connect', registrar);
      }
    };
  }, [user]);

  // ── Cargar notificaciones admin ──
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;
    const cargarNotifAdmin = async () => {
      try {
        const [resProv, resResenas] = await Promise.all([
          api.get('/admin/solicitudes-proveedores'),
          api.get('/admin/resenas'),
        ]);
        const ahora = new Date().toISOString();
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
              // Fecha de recepción real del aviso = ahora (carga)
              fecha_recepcion: ahora,
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
              // Fecha de recepción real del aviso = ahora (carga)
              fecha_recepcion: ahora,
            }))
          : [];
        const todas = [
          ...notifsResenas,
          ...notifsProv.sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)),
        ];
        setNotifAdmin(todas);
        recalcularNoLeidasAdmin(todas);
      } catch (e) {
        console.error('Error cargando notificaciones admin:', e);
      }
    };
    cargarNotifAdmin();
  }, [user]);

  // ── Escuchar notificaciones admin en tiempo real ──
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;
    const onNuevaSolicitudProv = (data) => {
      const notif = {
        ...data,
        id: 'prov_' + data.id_proveedor + '_rt_' + Date.now(),
        tipo: 'nuevo_proveedor',
        fecha_recepcion: new Date().toISOString(),
      };
      setNotifAdmin(prev => {
        if (prev.some(n => n.id_proveedor === data.id_proveedor && n.tipo === 'nuevo_proveedor')) return prev;
        const nueva = [notif, ...prev];
        recalcularNoLeidasAdmin(nueva);
        return nueva;
      });
    };
    const onResenaReportada = (data) => {
      const notif = {
        ...data,
        id: 'res_' + data.id_resena + '_rt_' + Date.now(),
        tipo: 'resena_reportada',
        fecha_recepcion: new Date().toISOString(),
      };
      setNotifAdmin(prev => {
        if (prev.some(n => n.id_resena === data.id_resena && n.tipo === 'resena_reportada')) return prev;
        const nueva = [notif, ...prev];
        recalcularNoLeidasAdmin(nueva);
        return nueva;
      });
    };
    const registrarListeners = () => {
      if (socketService.socket) {
        socketService.socket.on('admin_nueva_solicitud_proveedor', onNuevaSolicitudProv);
        socketService.socket.on('admin_resena_reportada', onResenaReportada);
      }
    };
    registrarListeners();
    if (socketService.socket)
      socketService.socket.on('connect', registrarListeners);
    return () => {
      if (socketService.socket) {
        socketService.socket.off('admin_nueva_solicitud_proveedor', onNuevaSolicitudProv);
        socketService.socket.off('admin_resena_reportada', onResenaReportada);
        socketService.socket.off('connect', registrarListeners);
      }
    };
  }, [user]);

  // ════════════════════════════════
  //  RENDERERS – Panel notificaciones
  // ════════════════════════════════

  const renderPanel = ({ items, pagina, setPagina, keyId, getTitulo, getPreview, getFechaRecepcion, onAbrir, leidasKey }) => {
    const leidas = getLeidas(leidasKey);
    const totalPaginas = Math.ceil(items.length / NOTIF_POR_PAGINA);
    const paginadas = items.slice(pagina * NOTIF_POR_PAGINA, (pagina + 1) * NOTIF_POR_PAGINA);
    return (
      <div className="nav-notif-panel">
        <div className="nav-notif-header">
          <span>🔔 Notificaciones</span>
          {totalPaginas > 1 && (
            <span className="nav-notif-pagina-label">{pagina + 1} / {totalPaginas}</span>
          )}
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

  // ── Panel Admin ──
  const renderPanelAdmin = () => {
    const userId = 'admin_' + (user?.id_administrador ?? user?.id);
    return renderPanel({
      items: notifAdmin,
      pagina: paginaAdmin,
      setPagina: setPaginaAdmin,
      leidasKey: userId,
      keyId: n => n.id,
      getTitulo: n => n.tipo === 'nuevo_proveedor' ? '🏪 Nuevo proveedor' : '⚠️ Reseña reportada',
      getPreview: n => n.tipo === 'nuevo_proveedor'
        ? n.nombre_negocio
        : (n.comentario?.length > 60 ? n.comentario.slice(0, 60) + '…' : n.comentario),
      // Siempre la fecha real de recepción del aviso
      getFechaRecepcion: n => n.fecha_recepcion,
      onAbrir: (n) => {
        marcarLeida(n.id, userId);
        setNotifAdminDetalle(n);
        setShowNotifAdmin(false);
        recalcularNoLeidasAdmin(notifAdmin);
      },
    });
  };

  // ── Panel general (cliente) ──
  const renderPanelNotif = () => {
    const userId = user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador;
    return renderPanel({
      items: notificaciones,
      pagina: paginaNotif,
      setPagina: setPaginaNotif,
      leidasKey: userId,
      keyId: n => n.id_notificacion,
      getTitulo: n => n.titulo,
      getPreview: n => n.mensaje?.length > 60 ? n.mensaje.slice(0, 60) + '…' : n.mensaje,
      getFechaRecepcion: n => n.fecha_envio,
      onAbrir: (n) => {
        marcarLeida(n.id_notificacion, userId);
        setNotifDetalle(n);
        setShowNotif(false);
        recalcularNoLeidas(notificaciones);
      },
    });
  };

  // ── Panel solicitudes proveedor ──
  const renderPanelSolicitudes = () => {
    const userId = 'solic_' + (user?.id_proveedor ?? user?.id);
    return renderPanel({
      items: notifSolicitudes,
      pagina: paginaSolicitudes,
      setPagina: setPaginaSolicitudes,
      leidasKey: userId,
      keyId: n => n.id,
      getTitulo: () => '📋 Nueva cotización',
      getPreview: n => n.tipo_evento ? `Evento: ${n.tipo_evento}` : (n.mensaje || 'Nueva solicitud recibida'),
      getFechaRecepcion: n => n.fecha_recepcion,
      onAbrir: (n) => {
        marcarLeida(n.id, userId);
        setNotifSolicDetalle(n);
        setShowNotifSolicitudes(false);
        recalcularNoLeidasSolicitudes(notifSolicitudes);
      },
    });
  };

  // ── Campanas ──
  const renderCampana = () => (
    <div className="nav-notif-wrapper" ref={notifRef}>
      <button className="nav-notif-btn" onClick={() => { setShowNotif(p => { if (!p) setPaginaNotif(0); return !p; }); setShowDropdown(false); }} aria-label="Notificaciones">
        <FaBell size={18} />
        {noLeidas > 0 && <span className="nav-notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>
      {showNotif && renderPanelNotif()}
    </div>
  );

  const renderCampanaSolicitudes = () => (
    <div className="nav-notif-wrapper" ref={notifSolicRef}>
      <button className="nav-notif-btn" onClick={() => { setShowNotifSolicitudes(p => { if (!p) setPaginaSolicitudes(0); return !p; }); setShowDropdown(false); }} aria-label="Nuevas cotizaciones">
        <FaBell size={18} />
        {noLeidasSolicitudes > 0 && <span className="nav-notif-badge">{noLeidasSolicitudes > 9 ? '9+' : noLeidasSolicitudes}</span>}
      </button>
      {showNotifSolicitudes && renderPanelSolicitudes()}
    </div>
  );

  const renderCampanaAdmin = () => (
    <div className="nav-notif-wrapper" ref={notifAdminRef}>
      <button className="nav-notif-btn" onClick={() => { setShowNotifAdmin(p => { if (!p) setPaginaAdmin(0); return !p; }); setShowDropdown(false); }} aria-label="Notificaciones">
        <FaBell size={18} />
        {noLeidasAdmin > 0 && <span className="nav-notif-badge">{noLeidasAdmin > 9 ? '9+' : noLeidasAdmin}</span>}
      </button>
      {showNotifAdmin && renderPanelAdmin()}
    </div>
  );

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
                {renderCampana()}
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
                {renderCampana()}
                {renderCampanaSolicitudes()}
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
                {renderCampanaAdmin()}
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

      {/* ═══════════ MODALES HOMOGÉNEOS ═══════════ */}

      {/* Modal Contáctanos */}
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

      {/* Modal Detalle notificación general */}
      {notifDetalle && (
        <ModalUnificado
          visible={true}
          icono="🔔"
          titulo={notifDetalle.titulo}
          descripcion={null}
          onClose={() => setNotifDetalle(null)}
          acciones={
            <>
              <div className="modal-notif-body">
                <p className="notif-detalle-mensaje">{notifDetalle.mensaje}</p>
                <span className="notif-detalle-fecha">{formatFecha(notifDetalle.fecha_envio)}</span>
              </div>
              <button className="modal-btn modal-btn--primario" onClick={() => setNotifDetalle(null)}>Cerrar</button>
            </>
          }
        />
      )}

      {/* Modal Detalle notificación Admin */}
      {notifAdminDetalle && (() => {
        const n = notifAdminDetalle;
        const esProveedor = n.tipo === 'nuevo_proveedor';
        return (
          <div className="modal-overlay" onClick={() => setNotifAdminDetalle(null)}>
            <div className="modal-card modal-card--ancho" onClick={e => e.stopPropagation()}>
              <div className="modal-icono">{esProveedor ? '🏪' : '⚠️'}</div>
              <h2 className="modal-titulo">
                {esProveedor ? 'Nuevo proveedor registrado' : 'Reseña reportada'}
              </h2>
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
                <button
                  className="modal-btn modal-btn--accion"
                  onClick={() => { setNotifAdminDetalle(null); navigate(esProveedor ? '/admin/solicitudes' : '/admin/resenas'); }}
                >
                  {esProveedor ? 'Ver solicitud del proveedor' : 'Ver reseñas reportadas'}
                </button>
                <button className="modal-btn modal-btn--secundario" onClick={() => setNotifAdminDetalle(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal Detalle nueva cotización (proveedor) */}
      <NotifProveedorDetalle
        notif={notifSolicDetalle}
        onCerrar={() => setNotifSolicDetalle(null)}
        onIrChat={(id) => navigate(`/chat/${id}`)}
      />
    </div>
  );
}

export default Layout;