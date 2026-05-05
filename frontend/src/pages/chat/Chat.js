import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/Layout';
import socketService from '../../services/socketService';
import { mensajeService } from '../../services/mensajeService';
import { solicitudService } from '../../services/solicitudService';
import ConversacionesList from './ConversacionesList';
import ModalSolicitud from './ModalSolicitud';
import './Chat.css';

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
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll automático al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  // Cargar usuario y conectar socket
  useEffect(() => {
    const userFromStorage = localStorage.getItem('user');
    let token = localStorage.getItem('token');

    if (userFromStorage) {
      try {
        const userData = JSON.parse(userFromStorage);
        console.log('✅ Usuario cargado:', userData);
        
        // Si el token no está dentro del usuario, buscarlo por separado
        if (!userData.token && token) {
          userData.token = token;
        }
        
        // Determinar el tipo basado en los campos disponibles
        if (!userData.tipo) {
          // Si tiene id_cliente, es cliente
          if (userData.id_cliente) {
            userData.tipo = 'cliente';
            userData.id = userData.id_cliente;
          } 
          // Si tiene id_proveedor, es proveedor
          else if (userData.id_proveedor) {
            userData.tipo = 'proveedor';
            userData.id = userData.id_proveedor;
          }
        }
        
        // Extraer nombre del nombre_completo si existe
        if (userData.nombre_completo && !userData.nombre) {
          userData.nombre = userData.nombre_completo.split(' ')[0];
        }
        
        console.log('✅ Usuario procesado:', {
          id: userData.id,
          tipo: userData.tipo,
          nombre: userData.nombre,
          tiene_token: !!userData.token
        });
        
        setUsuario(userData);
        
        if (userData.token) {
          socketService.connect(userData.token);
        } else {
          console.error('❌ Usuario sin token');
        }
      } catch (error) {
        console.error('❌ Error al parsear usuario:', error);
      }
    } else {
      console.error('❌ No se encontró usuario en localStorage');
    }

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Cargar conversaciones
  useEffect(() => {
    cargarConversaciones();
  }, []);

  // Cargar mensajes cuando cambia la conversación
  useEffect(() => {
    if (id_solicitud) {
      cargarMensajes(id_solicitud);
      socketService.joinConversation(parseInt(id_solicitud));

      return () => {
        socketService.leaveConversation(parseInt(id_solicitud));
      };
    }
  }, [id_solicitud]);

  // Escuchar nuevos mensajes
  useEffect(() => {
    socketService.onNewMessage((mensaje) => {
      setMensajes((prev) => [...prev, mensaje]);
      cargarConversaciones(); // Actualizar lista
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

  // Actualizar solicitudActual cuando cambia conversacionActual
  useEffect(() => {
    if (conversacionActual) {
      setSolicitudActual(conversacionActual);
      console.log('📋 Solicitud actual actualizada:', conversacionActual);
    }
  }, [conversacionActual]);

  const cargarConversaciones = async () => {
    try {
      const response = await mensajeService.obtenerConversaciones();
      setConversaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar conversaciones:', error);
    }
  };

  const cargarMensajes = async (solicitudId) => {
    try {
      const response = await mensajeService.obtenerMensajes(solicitudId);
      setMensajes(response.data || []);
      
      // Marcar como leídos
      await mensajeService.marcarComoLeidos(solicitudId);
      socketService.markAsRead(parseInt(solicitudId));
      
      // Encontrar conversación actual
      const conv = conversaciones.find(c => c.id_solicitud === parseInt(solicitudId));
      setConversacionActual(conv);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleEnviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim()) return;

    try {
      // Enviar por socket (más rápido)
      socketService.sendMessage(parseInt(id_solicitud), nuevoMensaje.trim());
      
      setNuevoMensaje('');
      socketService.stopTyping(parseInt(id_solicitud));
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  // Abrir modal con información de la solicitud
  const handleAbrirModal = () => {
    // Buscar la conversación más actualizada
    const conversacionActualizada = conversaciones.find(
      c => c.id_solicitud === parseInt(id_solicitud)
    );
    
    if (conversacionActualizada) {
      console.log('📋 Abriendo modal con solicitud:', conversacionActualizada);
      setSolicitudActual(conversacionActualizada);
      setModalOpen(true);
    } else if (conversacionActual) {
      // Fallback a conversacionActual si no se encuentra en la lista
      setSolicitudActual(conversacionActual);
      setModalOpen(true);
    }
  };

  // Cliente aprueba solicitud
  const handleAprobarSolicitud = async (id_solicitud) => {
    try {
      // ✅ Llamar al backend para aprobar
      await solicitudService.aprobar(id_solicitud);
      
      // Enviar mensaje automático
      socketService.sendMessage(
        parseInt(id_solicitud), 
        '✅ He aprobado tu propuesta. ¡Nos vemos pronto!'
      );
      
      alert('✅ Solicitud aprobada exitosamente');
      
      // Actualizar estado local
      setConversacionActual(prev => prev ? ({
        ...prev,
        estado: 'Aceptada'
      }) : null);
      
      setSolicitudActual(prev => prev ? ({
        ...prev,
        estado: 'Aceptada'
      }) : null);
      
      // Recargar conversaciones
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      alert('❌ Error al aprobar la solicitud');
    }
  };

  // Cliente rechaza solicitud
  const handleRechazarSolicitud = async (id_solicitud) => {
    try {
      // ✅ Llamar al backend para rechazar
      await solicitudService.rechazar(id_solicitud);
      
      // Enviar mensaje automático
      socketService.sendMessage(
        parseInt(id_solicitud), 
        '❌ Lamentablemente he decidido no continuar con esta solicitud. Gracias por tu tiempo.'
      );
      
      alert('❌ Solicitud rechazada');
      
      // Actualizar estado local
      setConversacionActual(prev => prev ? ({
        ...prev,
        estado: 'Rechazada'
      }) : null);
      
      setSolicitudActual(prev => prev ? ({
        ...prev,
        estado: 'Rechazada'
      }) : null);
      
      // Recargar conversaciones
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('❌ Error al rechazar la solicitud');
    }
  };

  // Proveedor envía propuesta
  const handleEnviarPropuesta = async (id_solicitud, propuesta) => {
    try {
      // Construir mensaje con la propuesta
      const mensajePropuesta = `📋 **Mi Propuesta**

💵 **Precio Total:** $${parseFloat(propuesta.precio).toLocaleString('es-MX')}

📝 **Descripción:**
${propuesta.descripcion}

${propuesta.fecha_servicio ? `📅 **Fecha:** ${new Date(propuesta.fecha_servicio).toLocaleDateString('es-MX')}` : ''}
${propuesta.hora_servicio ? `⏰ **Hora:** ${propuesta.hora_servicio}` : ''}

${propuesta.notas_adicionales ? `📋 **Notas:**\n${propuesta.notas_adicionales}` : ''}

¿Te parece bien esta propuesta? ¡Espero tu respuesta!`;
      
      // Enviar mensaje con la propuesta
      socketService.sendMessage(parseInt(id_solicitud), mensajePropuesta);
      
      // ✅ Llamar al backend para marcar como respondida
      await solicitudService.marcarComoRespondida(id_solicitud, propuesta);
      
      alert('✅ Propuesta enviada exitosamente');
      
      // Actualizar estado local
      setConversacionActual(prev => prev ? ({
        ...prev,
        estado: 'Respondida'
      }) : null);
      
      setSolicitudActual(prev => prev ? ({
        ...prev,
        estado: 'Respondida'
      }) : null);
      
      // Recargar conversaciones para actualizar el estado
      await cargarConversaciones();
      await cargarMensajes(id_solicitud);
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
      alert('❌ Error al enviar la propuesta');
    }
  };

  const handleTyping = (e) => {
    setNuevoMensaje(e.target.value);

    // Notificar que está escribiendo
    if (!typingTimeoutRef.current) {
      socketService.typing(parseInt(id_solicitud));
    }

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Después de 1 segundo sin escribir, notificar que dejó de escribir
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

  // Verificar si el siguiente mensaje es del mismo remitente
  const esUltimoDelGrupo = (index) => {
    if (index === mensajes.length - 1) return true;
    
    const mensajeActual = mensajes[index];
    const mensajeSiguiente = mensajes[index + 1];
    
    // Si el siguiente mensaje es de diferente remitente, este es el último del grupo
    return mensajeActual.id_remitente !== mensajeSiguiente.id_remitente ||
           mensajeActual.tipo_remitente !== mensajeSiguiente.tipo_remitente;
  };

  // Verificar si es el primero del grupo
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
      {/* Sidebar de conversaciones */}
      <ConversacionesList 
        conversaciones={conversaciones}
        conversacionActiva={id_solicitud}
        usuarioTipo={usuario?.tipo}
      />

      {/* Área del chat */}
      <div className="chat-main">
        {id_solicitud ? (
          <>
            {/* Header del chat */}
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

            {/* Mensajes */}
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

            {/* Input de mensaje */}
            <div className="chat-input-container">
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
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button 
                    type="button" 
                    className="chat-input-btn"
                    title="Emoji"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="9" r="1" fill="currentColor"/>
                      <circle cx="15" cy="9" r="1" fill="currentColor"/>
                    </svg>
                  </button>
                  <button type="submit" className="chat-send-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
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

    {/* MODAL DE SOLICITUD */}
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
    </Layout>
  );
};

export default Chat;