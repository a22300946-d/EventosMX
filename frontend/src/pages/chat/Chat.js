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
import { FiPaperclip, FiSend } from 'react-icons/fi';
import { FaStar } from 'react-icons/fa';

const Chat = () => {
  const { id_solicitud } = useParams();
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActual, setConversacionActual] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudActual, setSolicitudActual] = useState(null);
  const [modalResenaOpen, setModalResenaOpen] = useState(false);
  const [puedeDejarResena, setPuedeDejarResena] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
        
        if (!userData.token && token) {
          userData.token = token;
        }
        
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

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    cargarConversaciones();
  }, []);

  useEffect(() => {
    if (id_solicitud) {
      cargarMensajes(id_solicitud);
      socketService.joinConversation(parseInt(id_solicitud));

      return () => {
        socketService.leaveConversation(parseInt(id_solicitud));
      };
    }
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

    socketService.onUserStopTyping((data) => {
      setIsTyping(false);
    });

    return () => {
      socketService.off('new_message');
      socketService.off('user_typing');
      socketService.off('user_stop_typing');
    };
  }, [usuario]);

  useEffect(() => {
    if (conversacionActual) {
      setSolicitudActual(conversacionActual);
    }
  }, [conversacionActual]);

  useEffect(() => {
    verificarPuedeDejarResena();
  }, [conversacionActual, usuario]);

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
        setConversacionActual({
          ...conv,
          estado: conv.estado_solicitud || conv.estado
        });
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
      alert('Solicitud aprobada exitosamente');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Aceptada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      alert('Error al aprobar la solicitud. Por favor intenta de nuevo.');
    }
  };

  const handleRechazarSolicitud = async (id_solicitud) => {
    try {
      await solicitudService.rechazar(id_solicitud);
      socketService.sendMessage(parseInt(id_solicitud), 'Lamentablemente he decidido no continuar con esta solicitud. Gracias por tu tiempo.');
      alert('Solicitud rechazada');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Rechazada' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud. Por favor intenta de nuevo.');
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
      alert('Propuesta enviada exitosamente');
      setConversacionActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      setSolicitudActual(prev => prev ? ({ ...prev, estado: 'Respondida' }) : null);
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
      alert('Error al enviar la propuesta. Por favor intenta de nuevo.');
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
      
      if (resenaData.calificacion !== undefined && resenaData.sentimiento) {
        alert(`Reseña publicada exitosamente!\n\nCalificación: ${resenaData.calificacion}/5\nSentimiento: ${resenaData.sentimiento}`);
      } else {
        alert('Reseña publicada exitosamente!');
      }
      
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(parseInt(id_solicitud));
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const formatearHora = (fecha) => {
    const date = new Date(fecha);
    const horas = date.getHours().toString().padStart(2, '0');
    const minutos = date.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const obtenerNombreContacto = () => {
    if (!conversacionActual) return '';
    if (usuario?.tipo === 'cliente') {
      return conversacionActual.nombre_proveedor || 'Proveedor';
    } else {
      return conversacionActual.nombre_cliente || 'Cliente';
    }
  };

  const esPropio = (mensaje) => {
    return mensaje.tipo_remitente === usuario?.tipo && 
           mensaje.id_remitente === usuario?.id;
  };

  const esUltimoDelGrupo = (index) => {
    if (index === mensajes.length - 1) return true;
    const mensajeActual = mensajes[index];
    const mensajeSiguiente = mensajes[index + 1];
    return mensajeActual.id_remitente !== mensajeSiguiente.id_remitente ||
           mensajeActual.tipo_remitente !== mensajeSiguiente.tipo_remitente;
  };

  const esPrimeroDelGrupo = (index) => {
    if (index === 0) return true;
    const mensajeActual = mensajes[index];
    const mensajeAnterior = mensajes[index - 1];
    return mensajeActual.id_remitente !== mensajeAnterior.id_remitente ||
           mensajeActual.tipo_remitente !== mensajeAnterior.tipo_remitente;
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
    </Layout>
  );
};

export default Chat;