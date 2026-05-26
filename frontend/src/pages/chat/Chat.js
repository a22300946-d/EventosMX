import React, { useState, useEffect, useRef } from 'react';
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
import { FiPaperclip, FiSend, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

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
          {notif.tipo === 'error'
            ? <FiAlertCircle size={32} />
            : <FiCheckCircle size={32} />}
        </div>
        <div className="notif-body">
          <p className="notif-titulo">{notif.titulo}</p>
          {notif.detalle && <p className="notif-detalle">{notif.detalle}</p>}
        </div>
        <button className="notif-close" onClick={onClose}>
          <FiX size={20} />
        </button>
      </div>
    </div>
  );
};

const Chat = () => {
  const { id_solicitud } = useParams();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [modalResenaOpen, setModalResenaOpen] = useState(false);
  const [puedeDejarResena, setPuedeDejarResena] = useState(false);
  const [notif, setNotif] = useState(null); // { titulo, detalle, tipo }
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const mostrarNotif = (titulo, detalle = '', tipo = 'success') => {
    setNotif({ titulo, detalle, tipo });
  };

  const cerrarNotif = () => setNotif(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    let token = localStorage.getItem('token');

    if (userFromStorage) {
      try {
        const userData = JSON.parse(userFromStorage);
        console.log('Usuario cargado:', userData);

        if (!userData.token && token) userData.token = token;

        if (!userData.tipo) {
          if (userData.id_cliente) {
            userData.tipo = 'cliente';
            userData.id = userData.id_cliente;
          } else if (userData.id_proveedor) {
            userData.tipo = 'proveedor';
            userData.id = userData.id_proveedor;
          }
        }

        if (userData.nombre_completo && !userData.nombre) {
          userData.nombre = userData.nombre_completo.split(' ')[0];
        }

        setUsuario(userData);
        
        // FIX: solo conectar si aún no hay socket activo.
        // NO llamar disconnect() al desmontar — el socket es compartido con Layout
        // y destruirlo aquí borra todos los listeners de notificaciones del proveedor.
        if (userData.token) {
          socketService.connect(userData.token);
        } else {
          console.error('Usuario sin token');
        }
      } catch (error) {
        console.error('Error al parsear usuario:', error);
      }
    } else {
      console.error('No se encontró usuario en localStorage');
    }

    // FIX: se eliminó "return () => { socketService.disconnect(); }"
    // El socket es un singleton global gestionado por Layout; Chat no debe destruirlo.
  }, []);

  useEffect(() => { cargarConversaciones(); }, []);

  useEffect(() => {
    if (id_solicitud) {
      cargarMensajes(id_solicitud);
      socketService.joinConversation(parseInt(id_solicitud));
      return () => { socketService.leaveConversation(parseInt(id_solicitud)); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_solicitud]);

  useEffect(() => {
    socketService.onNewMessage((mensaje) => {
      setMensajes((prev) => [...prev, mensaje]);
      cargarConversaciones();
    });

    socketService.onUserTyping((data) => {
      if (data.user_type !== usuario?.tipo || data.user_id !== usuario?.id) {
        setIsTyping(true);
      }
    });

    socketService.onUserStopTyping(() => { setIsTyping(false); });

    return () => {
      socketService.off('new_message');
      socketService.off('user_typing');
      socketService.off('user_stop_typing');
    };
  }, [usuario]);

  useEffect(() => {
    if (conversacionActual) setSolicitudActual(conversacionActual);
  }, [conversacionActual]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { verificarPuedeDejarResena(); }, [conversacionActual, usuario]);

  const cargarConversaciones = async () => {
    try {
      const response = await mensajeService.obtenerConversaciones();
      const conversacionesMapeadas = (response.data || []).map(conv => ({
        ...conv,
        estado: conv.estado_solicitud || conv.estado
      }));
      setConversaciones(conversacionesMapeadas);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const cargarMensajes = async (solicitudId) => {
    try {
      const response = await mensajeService.obtenerMensajes(solicitudId);
      setMensajes(response.data || []);

      await mensajeService.marcarComoLeidos(solicitudId);
      socketService.markAsRead(parseInt(solicitudId));

      const conv = conversaciones.find(c => c.id_solicitud === parseInt(solicitudId));
      if (conv) {
        setConversacionActual({ ...conv, estado: conv.estado_solicitud || conv.estado });
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    try {
      socketService.sendMessage(parseInt(id_solicitud), nuevoMensaje.trim());
      setNuevoMensaje('');
      socketService.stopTyping(parseInt(id_solicitud));
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const handleAbrirModal = () => {
    const conversacionActualizada = conversaciones.find(
      c => c.id_solicitud === parseInt(id_solicitud)
    );

    if (conversacionActualizada) {
      setSolicitudActual({
        ...conversacionActualizada,
        estado: conversacionActualizada.estado_solicitud || conversacionActualizada.estado
      });
      setModalOpen(true);
    } else if (conversacionActual) {
      setSolicitudActual({
        ...conversacionActual,
        estado: conversacionActual.estado_solicitud || conversacionActual.estado
      });
      setModalOpen(true);
    }
  };

  const handleAprobarSolicitud = async (id_solicitud) => {
    try {
      await solicitudService.aprobar(id_solicitud);
      socketService.sendMessage(parseInt(id_solicitud), 'He aprobado tu propuesta. ¡Nos vemos pronto!');
      mostrarNotif('¡Solicitud aprobada!', 'La propuesta fue aceptada exitosamente.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      mostrarNotif('Error al aprobar', 'Por favor intenta de nuevo.', 'error');
    }
  };

  const handleRechazarSolicitud = async (id_solicitud) => {
    try {
      await solicitudService.rechazar(id_solicitud);
      socketService.sendMessage(parseInt(id_solicitud), 'Lamentablemente he decidido no continuar con esta solicitud. Gracias por tu tiempo.');
      mostrarNotif('Solicitud rechazada', 'La solicitud fue rechazada correctamente.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      mostrarNotif('Error al rechazar', 'Por favor intenta de nuevo.', 'error');
    }
  };

  const handleEnviarPropuesta = async (id_solicitud, propuesta) => {
    try {
      await solicitudService.marcarComoRespondida(id_solicitud, propuesta);

      const formatearFechaSinDesfase = (fechaString) => {
        if (!fechaString) return '';
        const [year, month, day] = fechaString.split('-').map(Number);
        const fecha = new Date(year, month - 1, day);
        return fecha.toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      };

      const mensajePropuesta = `**Mi Propuesta**\n\n**Precio Total:** $${parseFloat(propuesta.precio).toLocaleString('es-MX')}\n\n**Descripción:**\n${propuesta.descripcion}\n\n${propuesta.fecha_servicio ? `**Fecha:** ${formatearFechaSinDesfase(propuesta.fecha_servicio)}` : ''}\n${propuesta.hora_servicio ? `**Hora:** ${propuesta.hora_servicio}` : ''}\n\n${propuesta.notas_adicionales ? `**Notas:**\n${propuesta.notas_adicionales}` : ''}\n\n¿Te parece bien esta propuesta? ¡Espero tu respuesta!`;

      socketService.sendMessage(parseInt(id_solicitud), mensajePropuesta);
      mostrarNotif('¡Propuesta enviada!', 'El cliente recibirá tu propuesta en breve.');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
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
        const yaDejoResena = resenas.some(resena =>
          resena.id_cliente === usuario.id &&
          resena.id_solicitud === conversacionActual.id_solicitud
        );
        setPuedeDejarResena(!yaDejoResena);
      } catch (error) {
        console.error('Error al verificar si puede reseñar:', error);
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

      socketService.sendMessage(
        parseInt(id_solicitud),
        'He dejado una reseña sobre mi experiencia con el servicio.'
      );

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

    if (!typingTimeoutRef.current) {
      socketService.typing(parseInt(id_solicitud));
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(parseInt(id_solicitud));
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const formatearHora = (fecha) => {
    const date = new Date(fecha);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const obtenerNombreContacto = () => {
    if (!conversacionActual) return '';
    return usuario?.tipo === 'cliente'
      ? conversacionActual.nombre_proveedor || 'Proveedor'
      : conversacionActual.nombre_cliente || 'Cliente';
  };

  const esPropio = (mensaje) =>
    mensaje.tipo_remitente === usuario?.tipo && mensaje.id_remitente === usuario?.id;

  const esUltimoDelGrupo = (index) => {
    if (index === mensajes.length - 1) return true;
    return mensajes[index].id_remitente !== mensajes[index + 1].id_remitente ||
           mensajes[index].tipo_remitente !== mensajes[index + 1].tipo_remitente;
  };

  const esPrimeroDelGrupo = (index) => {
    if (index === 0) return true;
    return mensajes[index].id_remitente !== mensajes[index - 1].id_remitente ||
           mensajes[index].tipo_remitente !== mensajes[index - 1].tipo_remitente;
  };

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

              <div className="chat-messages">
                {mensajes.map((mensaje, index) => (
                  <div
                    key={mensaje.id_mensaje}
                    className={`mensaje ${esPropio(mensaje) ? 'mensaje-propio' : 'mensaje-otro'} ${
                      !esPrimeroDelGrupo(index) ? 'mensaje-agrupado' : ''
                    }`}
                  >
                    {!esPropio(mensaje) && esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar">
                        {mensaje.nombre_remitente?.charAt(0) || 'U'}
                      </div>
                    )}
                    {!esPropio(mensaje) && !esUltimoDelGrupo(index) && (
                      <div className="mensaje-avatar-placeholder"></div>
                    )}
                    <div className="mensaje-contenido">
                      <div className="mensaje-texto">{mensaje.contenido}</div>
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
                      <div className="mensaje-avatar-placeholder"></div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
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

      {/* Modal de notificación personalizado */}
      <Notificacion notif={notif} onClose={cerrarNotif} />
    </Layout>
  );
};

export default Chat;