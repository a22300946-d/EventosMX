import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import socketService from '../../services/socketService';
import { mensajeService } from '../../services/mensajeService';
import { solicitudService } from '../../services/solicitudService';
import { resenaService } from '../../services/resenaService';
import ConversacionesList from './ConversacionesList';
import ModalSolicitud from './ModalSolicitud';
import ModalResena from './ModalResena';
import './Chat.css';
import MensajeChat from './MensajeChat';
import { FiPaperclip, FiSend, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

/* ─────────────────────────────────────────────────────────────────────────────
   Carga el usuario desde localStorage de forma síncrona.
   Se llama UNA vez como initializer de useState para que `usuario` ya esté
   disponible en el primer render y `esPropio` funcione desde el inicio.
───────────────────────────────────────────────────────────────────────────── */
const cargarUsuario = () => {
  try {
    const raw = localStorage.getItem('user');
    const tokenSeparado = localStorage.getItem('token');
    if (!raw) return null;

    const u = JSON.parse(raw);

    // El token puede estar dentro del objeto user o guardado por separado
    if (!u.token && tokenSeparado) u.token = tokenSeparado;

    // Normalizar campo "tipo" (AuthContext guarda "rol", no "tipo")
    if (!u.tipo && u.rol) u.tipo = u.rol;

    // Normalizar id numérico según el tipo
    if (!u.id) {
      if (u.tipo === 'cliente' && u.id_cliente)   u.id = parseInt(u.id_cliente);
      if (u.tipo === 'proveedor' && u.id_proveedor) u.id = parseInt(u.id_proveedor);
    } else {
      u.id = parseInt(u.id);
    }

    // Nombre corto para el avatar
    if (!u.nombre && u.nombre_completo) u.nombre = u.nombre_completo.split(' ')[0];
    if (!u.nombre && u.nombre_negocio)  u.nombre = u.nombre_negocio.split(' ')[0];

    return u;
  } catch {
    return null;
  }
};

/* ── Modal de notificación ── */
const Notificacion = ({ notif, onClose }) => {
  if (!notif) return null;
  return (
    <div className="notif-overlay" onClick={onClose}>
      <div
        className={`notif-modal ${notif.tipo === 'error' ? 'notif-error' : 'notif-success'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="notif-icon">
          {notif.tipo === 'error' ? <FiAlertCircle size={32} /> : <FiCheckCircle size={32} />}
        </div>
        <div className="notif-body">
          <p className="notif-titulo">{notif.titulo}</p>
          {notif.detalle && <p className="notif-detalle">{notif.detalle}</p>}
        </div>
        <button className="notif-close" onClick={onClose}><FiX size={20} /></button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════ */

const Chat = () => {
  const { id_solicitud } = useParams();

  // FIX PRINCIPAL: cargar usuario síncronamente para que esPropio funcione
  // desde el primer render, sin depender de ningún useEffect
  const [usuario] = useState(cargarUsuario);

  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [modalResenaOpen, setModalResenaOpen] = useState(false);
  const [puedeDejarResena, setPuedeDejarResena] = useState(false);
  const [notif, setNotif] = useState(null);

  const chatMessagesRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const mostrarNotif = (titulo, detalle = '', tipo = 'success') =>
    setNotif({ titulo, detalle, tipo });
  const cerrarNotif = () => setNotif(null);

  // Scroll solo dentro del contenedor .chat-messages (no mueve el window)
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // ── Conectar socket con el token del usuario actual ──────────────────────
  // FIX: forzar reconexión si el socket existente pertenece a otro usuario.
  // El socketService es un singleton; si quedó conectado con el token de
  // otra sesión (p.ej. proveedor → cliente), los mensajes se guardan con el
  // id/tipo equivocado. Aquí garantizamos que el socket use SIEMPRE el token
  // del usuario que tiene la sesión activa en este momento.
  useEffect(() => {
    if (!usuario?.token) return;

    // Si ya hay un socket conectado, desconectarlo para reconectar con el
    // token correcto del usuario actual.
    if (socketService.socket) {
      socketService.disconnect();
    }
    socketService.connect(usuario.token);
    // No desconectar al desmontar — el socket es compartido con Layout
  }, [usuario]);

  // ── Cargar conversaciones al montar ─────────────────────────────────────
  useEffect(() => { cargarConversaciones(); }, []); // eslint-disable-line

  // ── Cargar mensajes al cambiar la URL ────────────────────────────────────
  useEffect(() => {
    if (!id_solicitud) return;
    cargarMensajesYConversacion(id_solicitud);
    socketService.joinConversation(parseInt(id_solicitud));
    return () => { socketService.leaveConversation(parseInt(id_solicitud)); };
  }, [id_solicitud]); // eslint-disable-line

  // ── Listeners de socket ──────────────────────────────────────────────────
  useEffect(() => {
    const onNewMessage = (mensaje) => {
      setMensajes(prev => [...prev, mensaje]);
      cargarConversaciones();
      setTimeout(scrollToBottom, 50);
    };
    const onTyping = (data) => {
      // Solo mostrar "escribiendo" si es el otro usuario
      if (data.user_type !== usuario?.tipo || parseInt(data.user_id) !== usuario?.id) {
        setIsTyping(true);
      }
    };
    const onStopTyping = () => setIsTyping(false);

    socketService.onNewMessage(onNewMessage);
    socketService.onUserTyping(onTyping);
    socketService.onUserStopTyping(onStopTyping);

    return () => {
      socketService.off('new_message');
      socketService.off('user_typing');
      socketService.off('user_stop_typing');
    };
  }, [usuario]); // eslint-disable-line

  useEffect(() => {
    if (conversacionActual) setSolicitudActual(conversacionActual);
  }, [conversacionActual]);

  useEffect(() => { verificarPuedeDejarResena(); }, [conversacionActual, usuario]); // eslint-disable-line

  // ── Funciones de carga ───────────────────────────────────────────────────

  const cargarConversaciones = async () => {
    try {
      const response = await mensajeService.obtenerConversaciones();
      const mapeadas = (response.data || []).map(conv => ({
        ...conv,
        estado: conv.estado_solicitud || conv.estado
      }));
      setConversaciones(mapeadas);
      return mapeadas;
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
      return [];
    }
  };

  // Carga mensajes y conversaciones en paralelo para evitar race condition
  // en el header "con quién estás chateando"
  const cargarMensajesYConversacion = async (solicitudId) => {
    try {
      const [responseMensajes, convsMapeadas] = await Promise.all([
        mensajeService.obtenerMensajes(solicitudId),
        cargarConversaciones()
      ]);

      setMensajes(responseMensajes.data || []);
      setTimeout(scrollToBottom, 50);

      await mensajeService.marcarComoLeidos(solicitudId);
      socketService.markAsRead(parseInt(solicitudId));

      const conv = convsMapeadas.find(c => c.id_solicitud === parseInt(solicitudId));
      if (conv) {
        setConversacionActual({ ...conv, estado: conv.estado_solicitud || conv.estado });
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const cargarMensajes = (solicitudId) => cargarMensajesYConversacion(solicitudId);

  // ── Handlers de acciones ─────────────────────────────────────────────────

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    socketService.sendMessage(parseInt(id_solicitud), nuevoMensaje.trim());
    setNuevoMensaje('');
    socketService.stopTyping(parseInt(id_solicitud));
  };

  const handleAbrirModal = () => {
    const conv = conversaciones.find(c => c.id_solicitud === parseInt(id_solicitud))
      || conversacionActual;
    if (conv) {
      setSolicitudActual({ ...conv, estado: conv.estado_solicitud || conv.estado });
      setModalOpen(true);
    }
  };

  const handleAprobarSolicitud = async (id_sol) => {
    try {
      await solicitudService.aprobar(id_sol);
      socketService.sendMessage(parseInt(id_sol), 'He aprobado tu propuesta. ¡Nos vemos pronto!');
      mostrarNotif('¡Solicitud aprobada!', 'La propuesta fue aceptada exitosamente.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_sol);
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      mostrarNotif('Error al aprobar', 'Por favor intenta de nuevo.', 'error');
    }
  };

  const handleRechazarSolicitud = async (id_sol) => {
    try {
      await solicitudService.rechazar(id_sol);
      socketService.sendMessage(parseInt(id_sol), 'Lamentablemente he decidido no continuar con esta solicitud. Gracias por tu tiempo.');
      mostrarNotif('Solicitud rechazada', 'La solicitud fue rechazada correctamente.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_sol);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      mostrarNotif('Error al rechazar', 'Por favor intenta de nuevo.', 'error');
    }
  };

  const handleEnviarPropuesta = async (id_sol, propuesta) => {
    try {
      await solicitudService.marcarComoRespondida(id_sol, propuesta);

      const formatearFechaSinDesfase = (fechaString) => {
        if (!fechaString) return '';
        const [year, month, day] = fechaString.split('-').map(Number);
        return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      };

      const tienePromo = solicitudActual?.id_promocion && solicitudActual?.promocion_titulo;
      const promoVigente = tienePromo && solicitudActual?.promocion_activa;
      const lineaPromo = tienePromo
        ? `\n\n🏷️ **Promoción:** ${solicitudActual.promocion_titulo} (${solicitudActual.porcentaje_descuento}% OFF — $${parseFloat(solicitudActual.precio_promocional).toLocaleString('es-MX')}) ${promoVigente ? '✅ Vigente' : '⚠️ Vencida'}`
        : '';

      const mensajePropuesta =
        `**Mi Propuesta**\n\n` +
        `**Precio Total:** $${parseFloat(propuesta.precio).toLocaleString('es-MX')}\n\n` +
        `**Descripción:**\n${propuesta.descripcion}\n\n` +
        (propuesta.fecha_servicio ? `**Fecha:** ${formatearFechaSinDesfase(propuesta.fecha_servicio)}\n` : '') +
        (propuesta.hora_servicio ? `**Hora:** ${propuesta.hora_servicio}\n` : '') +
        (propuesta.notas_adicionales ? `\n**Notas:**\n${propuesta.notas_adicionales}` : '') +
        lineaPromo +
        `\n\n¿Te parece bien esta propuesta? ¡Espero tu respuesta!`;

      socketService.sendMessage(parseInt(id_sol), mensajePropuesta);
      mostrarNotif('¡Propuesta enviada!', 'El cliente recibirá tu propuesta en breve.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_sol);
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
      mostrarNotif('Error al enviar propuesta', 'Por favor intenta de nuevo.', 'error');
    }
  };

  const verificarPuedeDejarResena = async () => {
    if (!conversacionActual || usuario?.tipo !== 'cliente') {
      setPuedeDejarResena(false);
      return;
    }
    const estadoValido = conversacionActual.estado === 'Aceptada' ||
                         conversacionActual.estado_solicitud === 'Aceptada';
    const fechaEvento = conversacionActual.fecha_evento;
    const eventoYaPaso = fechaEvento && new Date(fechaEvento) < new Date();

    if (estadoValido && eventoYaPaso && conversacionActual.id_proveedor) {
      try {
        const response = await resenaService.obtenerPorProveedor(conversacionActual.id_proveedor);
        const resenas = response.data || response;
        const yaDejoResena = resenas.some(r =>
          r.id_cliente === usuario.id && r.id_solicitud === conversacionActual.id_solicitud
        );
        setPuedeDejarResena(!yaDejoResena);
      } catch {
        setPuedeDejarResena(false);
      }
    } else {
      setPuedeDejarResena(false);
    }
  };

  const handleEnviarResena = async (datosResena) => {
    try {
      const response = await resenaService.crear(datosResena);
      const resenaData = response.data || response;
      socketService.sendMessage(parseInt(id_solicitud), 'He dejado una reseña sobre mi experiencia con el servicio.');
      const detalle = resenaData.calificacion !== undefined && resenaData.sentimiento
        ? `Calificación: ${resenaData.calificacion}/5 · Sentimiento: ${resenaData.sentimiento}`
        : '';
      mostrarNotif('¡Reseña publicada!', detalle);
      setModalResenaOpen(false);
      setPuedeDejarResena(false);
    } catch (error) {
      console.error('Error al enviar reseña:', error);
      throw error;
    }
  };

  const handleTyping = (e) => {
    setNuevoMensaje(e.target.value);
    if (!typingTimeoutRef.current) socketService.typing(parseInt(id_solicitud));
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(parseInt(id_solicitud));
      typingTimeoutRef.current = null;
    }, 1000);
  };

  // ── Helpers de UI ────────────────────────────────────────────────────────

  const formatearHora = (fecha) => {
    const d = new Date(fecha);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const obtenerNombreContacto = () => {
    if (!conversacionActual) return '';
    return usuario?.tipo === 'cliente'
      ? (conversacionActual.nombre_proveedor || 'Proveedor')
      : (conversacionActual.nombre_cliente   || 'Cliente');
  };

  // FIX: comparar tipo y id numéricamente para determinar si el mensaje es propio
  const esPropio = (mensaje) =>
    mensaje.tipo_remitente === usuario?.tipo &&
    parseInt(mensaje.id_remitente) === usuario?.id;

  const esUltimoDelGrupo = useMemo(() => (index) => {
    if (index === mensajes.length - 1) return true;
    return mensajes[index].id_remitente !== mensajes[index + 1].id_remitente ||
           mensajes[index].tipo_remitente !== mensajes[index + 1].tipo_remitente;
  }, [mensajes]);

  const esPrimeroDelGrupo = useMemo(() => (index) => {
    if (index === 0) return true;
    return mensajes[index].id_remitente !== mensajes[index - 1].id_remitente ||
           mensajes[index].tipo_remitente !== mensajes[index - 1].tipo_remitente;
  }, [mensajes]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="chat-container">
        <ConversacionesList
          conversaciones={conversaciones}
          conversacionActiva={id_solicitud}
          usuarioTipo={usuario?.tipo}
        />

        <div className="chat-main">
          {id_solicitud ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-avatar">
                    {obtenerNombreContacto()?.charAt(0) || '?'}
                  </div>
                  <div className="chat-header-text">
                    <h3>{obtenerNombreContacto()}</h3>
                    {isTyping && <span className="typing-indicator">Escribiendo...</span>}
                  </div>
                </div>
              </div>

              <div className="chat-messages" ref={chatMessagesRef}>
                {mensajes.map((mensaje, index) => (
                  <div
                    key={mensaje.id_mensaje}
                    className={`mensaje ${esPropio(mensaje) ? 'mensaje-propio' : 'mensaje-otro'} ${
                      !esPrimeroDelGrupo(index) ? 'mensaje-agrupado' : ''
                    } ${
                      (mensaje.contenido?.includes('📋 Nueva solicitud') ||
                       mensaje.contenido?.includes('**Mi Propuesta**') ||
                       mensaje.contenido?.includes('**Precio Total:**'))
                        ? 'mensaje-con-tarjeta' : ''
                    }`}
                  >
                    {!esPropio(mensaje) && esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar">
                        {mensaje.nombre_remitente?.charAt(0) || 'U'}
                      </div>
                    )}
                    {!esPropio(mensaje) && !esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar-placeholder" />
                    )}
                    <div className={
                      `mensaje-contenido${
                        (mensaje.contenido?.includes('📋 Nueva solicitud') ||
                         mensaje.contenido?.includes('**Mi Propuesta**') ||
                         mensaje.contenido?.includes('**Precio Total:**'))
                          ? ' mensaje-contenido-tarjeta' : ''
                      }`
                    }>
                      <MensajeChat mensaje={mensaje} esPropio={esPropio(mensaje)} />
                      <div className="mensaje-hora">
                        {formatearHora(mensaje.fecha_envio)}
                        {esPropio(mensaje) && mensaje.leido && (
                          <span className="mensaje-leido">✓✓</span>
                        )}
                      </div>
                    </div>
                    {esPropio(mensaje) && esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar mensaje-avatar-propio">
                        {usuario?.nombre?.charAt(0) || 'Y'}
                      </div>
                    )}
                    {esPropio(mensaje) && !esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar-placeholder" />
                    )}
                  </div>
                ))}
              </div>

              <div className="chat-input-container">
                {puedeDejarResena && (
                  <button
                    className="btn-dejar-resena"
                    onClick={() => setModalResenaOpen(true)}
                    title="Dejar una reseña sobre este servicio"
                  >
                    <FaStar style={{ marginRight: 6 }} />
                    Dejar Reseña
                  </button>
                )}
                <form onSubmit={handleEnviarMensaje} className="chat-input-form">
                  <input
                    type="text"
                    placeholder="Escribir algo..."
                    value={nuevoMensaje}
                    onChange={handleTyping}
                    className="chat-input"
                  />
                  <div className="chat-input-actions">
                    <button
                      type="button"
                      className="chat-input-btn"
                      title={usuario?.tipo === 'cliente' ? 'Ver solicitud' : 'Enviar propuesta'}
                      onClick={handleAbrirModal}
                    >
                      <FiPaperclip size={20} />
                    </button>
                    <button type="submit" className="chat-send-btn">
                      <FiSend size={20} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="chat-empty">
              <h2>Selecciona una conversación</h2>
              <p>Elige una conversación del menú de la izquierda para comenzar</p>
            </div>
          )}
        </div>
      </div>

      <ModalSolicitud
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        solicitud={solicitudActual}
        usuarioTipo={usuario?.tipo}
        mensajes={mensajes}
        onAprobar={handleAprobarSolicitud}
        onRechazar={handleRechazarSolicitud}
        onEnviarPropuesta={handleEnviarPropuesta}
      />

      <ModalResena
        isOpen={modalResenaOpen}
        onClose={() => setModalResenaOpen(false)}
        solicitud={{
          ...conversacionActual,
          nombre_proveedor: conversacionActual?.nombre_negocio || conversacionActual?.proveedor_nombre
        }}
        onEnviar={handleEnviarResena}
      />

      <Notificacion notif={notif} onClose={cerrarNotif} />
    </Layout>
  );
};

export default Chat;