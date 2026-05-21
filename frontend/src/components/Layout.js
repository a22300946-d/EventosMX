import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaInstagram, FaChevronDown, FaBell } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import socketService from '../services/socketService';
import api from '../services/api';
import './Layout.css';

// Clave de localStorage por usuario para IDs de notificaciones leídas
function getLsKey(userId) {
  return `notif_leidas_${userId}`;
}

function getLeidas(userId) {
  try {
    return new Set(JSON.parse(localStorage.getItem(getLsKey(userId)) || '[]'));
  } catch {
    return new Set();
  }
}

function marcarLeida(id, userId) {
  const leidas = getLeidas(userId);
  leidas.add(id);
  localStorage.setItem(getLsKey(userId), JSON.stringify([...leidas]));
}

function Layout({ children, showNav = true }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [modalContacto, setModalContacto] = useState(false);
  const dropdownRef = useRef(null);

  // ── Notificaciones ──
  const [notificaciones, setNotificaciones] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const notifRef = useRef(null);

  // Modal de detalle de notificación
  const [notifDetalle, setNotifDetalle] = useState(null);
  // Paginación del panel de notificaciones (3 por página)
  const NOTIF_POR_PAGINA = 3;
  const [paginaNotif, setPaginaNotif] = useState(0);

  // ── Notificaciones del Admin ──
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

  // Conectar socket en Layout para que esté disponible antes de ir al Chat
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recalcular conteo de no leídas cada vez que cambian las notificaciones
  const recalcularNoLeidas = (lista) => {
    const leidas = getLeidas(user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador);
    const count = lista.filter(n => !leidas.has(n.id_notificacion)).length;
    setNoLeidas(count);
  };

  // Cargar notificaciones al iniciar sesión
  useEffect(() => {
    if (!user || user.rol === 'admin') return;
    const rol = user.rol;

    api.get(`/admin/notificaciones?rol=${rol}`)
      .then(res => {
        if (res.data.success) {
          setNotificaciones(res.data.data);
          recalcularNoLeidas(res.data.data);
        }
      })
      .catch(() => {});
  }, [user]);

  // Escuchar notificaciones en tiempo real
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
      if (user.rol === 'cliente') {
        socketService.socket.on('nueva_notificacion_cliente', agregarNotif);
      } else if (user.rol === 'proveedor') {
        socketService.socket.on('nueva_notificacion_proveedor', agregarNotif);
      }
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('nueva_notificacion', agregarNotif);
        socketService.socket.off('nueva_notificacion_cliente', agregarNotif);
        socketService.socket.off('nueva_notificacion_proveedor', agregarNotif);
      }
    };
  }, [user]);

  // Helper para recalcular no leídas del admin
  const recalcularNoLeidasAdmin = (lista) => {
    const userId = user?.id_administrador ?? user?.id;
    const leidas = getLeidas('admin_' + userId);
    const count = lista.filter(n => !leidas.has(n.id)).length;
    setNoLeidasAdmin(count);
  };

  // Cargar notificaciones admin al iniciar (proveedores pendientes + reseñas reportadas)
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;

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
              fecha: r.fecha_publicacion,
            }))
          : [];

        // Ordenar: reseñas primero (más urgentes), luego proveedores por fecha desc
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

  // Escuchar notificaciones de admin en tiempo real via socket
  useEffect(() => {
    if (!user || user.rol !== 'admin') return;

    const onNuevaSolicitud = (data) => {
      const notif = { ...data, id: 'prov_' + data.id_proveedor + '_rt_' + Date.now() };
      setNotifAdmin(prev => {
        // Evitar duplicado si ya cargó por API
        const yaExiste = prev.some(n => n.id_proveedor === data.id_proveedor && n.tipo === 'nuevo_proveedor');
        if (yaExiste) return prev;
        const nueva = [notif, ...prev];
        recalcularNoLeidasAdmin(nueva);
        return nueva;
      });
    };

    const onResenaReportada = (data) => {
      const notif = { ...data, id: 'res_' + data.id_resena + '_rt_' + Date.now() };
      setNotifAdmin(prev => {
        const yaExiste = prev.some(n => n.id_resena === data.id_resena && n.tipo === 'resena_reportada');
        if (yaExiste) return prev;
        const nueva = [notif, ...prev];
        recalcularNoLeidasAdmin(nueva);
        return nueva;
      });
    };

    const registrarListeners = () => {
      if (socketService.socket) {
        socketService.socket.on('admin_nueva_solicitud_proveedor', onNuevaSolicitud);
        socketService.socket.on('admin_resena_reportada', onResenaReportada);
      }
    };

    // Intentar registrar ahora; si el socket aún no está listo, esperar el evento connect
    registrarListeners();
    if (socketService.socket) {
      socketService.socket.on('connect', registrarListeners);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('admin_nueva_solicitud_proveedor', onNuevaSolicitud);
        socketService.socket.off('admin_resena_reportada', onResenaReportada);
        socketService.socket.off('connect', registrarListeners);
      }
    };
  }, [user]);

  const handleAbrirNotifAdmin = () => {
    setShowNotifAdmin(prev => {
      if (!prev) setPaginaAdmin(0);
      return !prev;
    });
    setShowDropdown(false);
  };

  const handleAbrirDetalleAdmin = (notif) => {
    const userId = 'admin_' + (user?.id_administrador ?? user?.id);
    marcarLeida(notif.id, userId);
    setNotifAdminDetalle(notif);
    setShowNotifAdmin(false);
    recalcularNoLeidasAdmin(notifAdmin);
  };

  const handleCerrarDetalleAdmin = () => setNotifAdminDetalle(null);

  const renderPanelAdmin = () => {
    const userId = 'admin_' + (user?.id_administrador ?? user?.id);
    const leidas = getLeidas(userId);
    const totalPaginas = Math.ceil(notifAdmin.length / NOTIF_POR_PAGINA);
    const paginadas = notifAdmin.slice(paginaAdmin * NOTIF_POR_PAGINA, (paginaAdmin + 1) * NOTIF_POR_PAGINA);

    return (
      <div className="nav-notif-panel">
        <div className="nav-notif-header">
          <span>🔔 Notificaciones</span>
          {totalPaginas > 1 && (
            <span className="nav-notif-pagina-label">{paginaAdmin + 1} / {totalPaginas}</span>
          )}
        </div>
        {notifAdmin.length === 0 ? (
          <div className="nav-notif-empty">Sin notificaciones nuevas</div>
        ) : (
          <>
            <ul className="nav-notif-list">
              {paginadas.map(n => {
                const esLeida = leidas.has(n.id);
                const esProveedor = n.tipo === 'nuevo_proveedor';
                return (
                  <li
                    key={n.id}
                    className={`nav-notif-item${esLeida ? ' nav-notif-item--leida' : ''}`}
                    onClick={() => handleAbrirDetalleAdmin(n)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && handleAbrirDetalleAdmin(n)}
                  >
                    {!esLeida && <span className="nav-notif-dot" />}
                    <span className="nav-notif-titulo">
                      {esProveedor ? '🏪 Nuevo proveedor' : '⚠️ Reseña reportada'}
                    </span>
                    <span className="nav-notif-preview">
                      {esProveedor
                        ? n.nombre_negocio
                        : (n.comentario?.length > 60 ? n.comentario.slice(0, 60) + '…' : n.comentario)}
                    </span>
                    <span className="nav-notif-fecha">{formatFecha(esProveedor ? n.fecha_registro : n.fecha)}</span>
                  </li>
                );
              })}
            </ul>
            {totalPaginas > 1 && (
              <div className="nav-notif-paginacion">
                <button
                  className="nav-notif-pag-btn"
                  onClick={() => setPaginaAdmin(p => p - 1)}
                  disabled={paginaAdmin === 0}
                  aria-label="Página anterior"
                >‹ Anterior</button>
                <button
                  className="nav-notif-pag-btn"
                  onClick={() => setPaginaAdmin(p => p + 1)}
                  disabled={paginaAdmin >= totalPaginas - 1}
                  aria-label="Página siguiente"
                >Siguiente ›</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCampanaAdmin = () => (
    <div className="nav-notif-wrapper" ref={notifAdminRef}>
      <button className="nav-notif-btn" onClick={handleAbrirNotifAdmin} aria-label="Notificaciones">
        <FaBell size={18} />
        {noLeidasAdmin > 0 && <span className="nav-notif-badge">{noLeidasAdmin > 9 ? '9+' : noLeidasAdmin}</span>}
      </button>
      {showNotifAdmin && renderPanelAdmin()}
    </div>
  );

  const handleAbrirNotif = () => {
    setShowNotif(prev => {
      if (!prev) setPaginaNotif(0); // resetear página al abrir
      return !prev;
    });
    setShowDropdown(false);
    // NO resetear noLeidas aquí — solo se marca al abrir el detalle
  };

  // Abrir modal de detalle y marcar como leída
  const handleAbrirDetalle = (notif) => {
    marcarLeida(notif.id_notificacion, user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador);
    setNotifDetalle(notif);
    setShowNotif(false);
    // Recalcular badge
    recalcularNoLeidas(notificaciones);
  };

  const handleCerrarDetalle = () => setNotifDetalle(null);

  const formatFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Renderizado del panel de notificaciones con paginación de 3 en 3
  const renderPanelNotif = () => {
    const userId = user?.id_usuario ?? user?.id_proveedor ?? user?.id_administrador;
    const leidas = getLeidas(userId);
    const totalPaginas = Math.ceil(notificaciones.length / NOTIF_POR_PAGINA);
    const paginadas = notificaciones.slice(paginaNotif * NOTIF_POR_PAGINA, (paginaNotif + 1) * NOTIF_POR_PAGINA);

    return (
    <div className="nav-notif-panel">
      <div className="nav-notif-header">
        <span>🔔 Notificaciones</span>
        {totalPaginas > 1 && (
          <span className="nav-notif-pagina-label">{paginaNotif + 1} / {totalPaginas}</span>
        )}
      </div>
      {notificaciones.length === 0 ? (
        <div className="nav-notif-empty">Sin notificaciones</div>
      ) : (
        <>
          <ul className="nav-notif-list">
            {paginadas.map(n => {
              const esLeida = leidas.has(n.id_notificacion);
              return (
                <li
                  key={n.id_notificacion}
                  className={`nav-notif-item${esLeida ? ' nav-notif-item--leida' : ''}`}
                  onClick={() => handleAbrirDetalle(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && handleAbrirDetalle(n)}
                >
                  {!esLeida && <span className="nav-notif-dot" />}
                  <span className="nav-notif-titulo">{n.titulo}</span>
                  <span className="nav-notif-preview">{n.mensaje.length > 60 ? n.mensaje.slice(0, 60) + '…' : n.mensaje}</span>
                  <span className="nav-notif-fecha">{formatFecha(n.fecha_envio)}</span>
                </li>
              );
            })}
          </ul>
          {totalPaginas > 1 && (
            <div className="nav-notif-paginacion">
              <button
                className="nav-notif-pag-btn"
                onClick={() => setPaginaNotif(p => p - 1)}
                disabled={paginaNotif === 0}
                aria-label="Página anterior"
              >‹ Anterior</button>
              <button
                className="nav-notif-pag-btn"
                onClick={() => setPaginaNotif(p => p + 1)}
                disabled={paginaNotif >= totalPaginas - 1}
                aria-label="Página siguiente"
              >Siguiente ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
  };

  // Renderizado de la campana (igual para cliente y proveedor)
  const renderCampana = () => (
    <div className="nav-notif-wrapper" ref={notifRef}>
      <button className="nav-notif-btn" onClick={handleAbrirNotif} aria-label="Notificaciones">
        <FaBell size={18} />
        {noLeidas > 0 && <span className="nav-notif-badge">{noLeidas > 9 ? '9+' : noLeidas}</span>}
      </button>
      {showNotif && renderPanelNotif()}
    </div>
  );

  return (
    <div className="layout">
      {showNav && (
        <nav className="navbar">
          <div className="navbar-content">
            <Link to={user?.rol === 'admin' ? '/admin/usuarios' : '/'} className="logo">EventosMX</Link>

            {/* ========== NAVBAR CLIENTE ========== */}
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

            {/* ========== NAVBAR PROVEEDOR ========== */}
            {user && user.rol === 'proveedor' && (
              <div className="nav-links">
                {!isMobile && (
                  <>
                    <Link to="/chat">Chat</Link>
                    <Link to="/proveedor/cuenta/solicitudes">Solicitudes</Link>
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

            {/* ========== NAVBAR ADMIN ========== */}
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

      {/* ========== Modal Contáctanos ========== */}
      {modalContacto && (
        <div className="contacto-modal-overlay" onClick={() => setModalContacto(false)}>
          <div className="contacto-modal" onClick={e => e.stopPropagation()}>
            <div className="contacto-modal-icono">✉️</div>
            <h2 className="contacto-modal-titulo">Contáctanos</h2>
            <p className="contacto-modal-desc">Para comunicarte con el administrador, envíanos un correo a:</p>
            <a className="contacto-modal-email" href="https://mail.google.com/mail/?view=cm&fs=1&to=admin@eventosmx.com" target="_blank" rel="noopener noreferrer">
              admin@eventosmx.com
            </a>
            <p className="contacto-modal-nota">Nos pondremos en contacto contigo a la brevedad posible.</p>
            <button className="contacto-modal-btn" onClick={() => setModalContacto(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ========== Modal Detalle de Notificación ========== */}
      {notifDetalle && (
        <div className="notif-detalle-overlay" onClick={handleCerrarDetalle}>
          <div className="notif-detalle-modal" onClick={e => e.stopPropagation()}>
            <div className="notif-detalle-icono">🔔</div>
            <h2 className="notif-detalle-titulo">{notifDetalle.titulo}</h2>
            <p className="notif-detalle-mensaje">{notifDetalle.mensaje}</p>
            <span className="notif-detalle-fecha">{formatFecha(notifDetalle.fecha_envio)}</span>
            <button className="notif-detalle-btn" onClick={handleCerrarDetalle}>Cerrar</button>
          </div>
        </div>
      )}

      {/* ========== Modal Detalle de Notificación Admin ========== */}
      {notifAdminDetalle && (() => {
        const n = notifAdminDetalle;
        const esProveedor = n.tipo === 'nuevo_proveedor';
        return (
          <div className="notif-detalle-overlay" onClick={handleCerrarDetalleAdmin}>
            <div className="notif-detalle-modal notif-detalle-modal--admin" onClick={e => e.stopPropagation()}>
              <div className="notif-detalle-icono">{esProveedor ? '🏪' : '⚠️'}</div>
              <h2 className="notif-detalle-titulo">
                {esProveedor ? 'Nuevo proveedor registrado' : 'Reseña reportada'}
              </h2>

              {esProveedor ? (
                <div className="notif-admin-info">
                  <div className="notif-admin-row"><span className="notif-admin-label">Negocio</span><span>{n.nombre_negocio}</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Correo</span><span>{n.correo}</span></div>
                  {n.telefono && <div className="notif-admin-row"><span className="notif-admin-label">Teléfono</span><span>{n.telefono}</span></div>}
                  {n.ciudad && <div className="notif-admin-row"><span className="notif-admin-label">Ciudad</span><span>{n.ciudad}</span></div>}
                  <div className="notif-admin-row"><span className="notif-admin-label">Tipo de servicio</span><span>{n.tipo_servicio}</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Fecha de registro</span><span>{formatFecha(n.fecha_registro)}</span></div>
                </div>
              ) : (
                <div className="notif-admin-info">
                  <div className="notif-admin-row"><span className="notif-admin-label">Motivo del reporte</span><span>{n.motivo}</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Comentario</span><span>{n.comentario}</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Calificación</span><span>{'⭐'.repeat(Math.round(n.calificacion || 0))} ({n.calificacion})</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Sentimiento</span><span>{n.sentimiento}</span></div>
                  <div className="notif-admin-row"><span className="notif-admin-label">Fecha</span><span>{formatFecha(n.fecha)}</span></div>
                </div>
              )}

              <div className="notif-admin-acciones">
                <button
                  className="notif-detalle-btn notif-detalle-btn--accion"
                  onClick={() => {
                    handleCerrarDetalleAdmin();
                    navigate(esProveedor ? '/admin/solicitudes' : '/admin/resenas');
                  }}
                >
                  {esProveedor ? 'Ver solicitud del proveedor' : 'Ver reseñas reportadas'}
                </button>
                <button className="notif-detalle-btn notif-detalle-btn--cerrar" onClick={handleCerrarDetalleAdmin}>Cerrar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default Layout;