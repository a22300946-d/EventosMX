import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket ya está conectado');
      return;
    }

    // Si no se pasa token como parámetro, intentar obtenerlo de localStorage
    if (!token) {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          token = userData.token;
        } catch (error) {
          console.error('Error al parsear user:', error);
        }
      }
      
      if (!token) {
        token = localStorage.getItem('token');
      }
    }

    if (!token) {
      console.error('❌ No se puede conectar Socket.IO sin token');
      return;
    }

    console.log('🔌 Conectando Socket.IO con token...');

    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('✅ Conectado a Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.IO');
    });

    this.socket.on('error', (error) => {
      console.error('Error en Socket.IO:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners = {};
    }
  }

  // Unirse a una conversación
  joinConversation(id_solicitud) {
    if (this.socket) {
      this.socket.emit('join_conversation', id_solicitud);
    }
  }

  // Salir de una conversación
  leaveConversation(id_solicitud) {
    if (this.socket) {
      this.socket.emit('leave_conversation', id_solicitud);
    }
  }

  // Enviar mensaje
  sendMessage(id_solicitud, contenido) {
    if (this.socket) {
      this.socket.emit('send_message', { id_solicitud, contenido });
    }
  }

  // Marcar como leído
  markAsRead(id_solicitud) {
    if (this.socket) {
      this.socket.emit('mark_as_read', { id_solicitud });
    }
  }

  // Usuario escribiendo
  typing(id_solicitud) {
    if (this.socket) {
      this.socket.emit('typing', { id_solicitud });
    }
  }

  // Usuario dejó de escribir
  stopTyping(id_solicitud) {
    if (this.socket) {
      this.socket.emit('stop_typing', { id_solicitud });
    }
  }

  // Escuchar nuevos mensajes
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Escuchar mensajes leídos
  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on('messages_read', callback);
    }
  }

  // Escuchar usuario escribiendo
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  // Escuchar usuario dejó de escribir
  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  // Remover listener
  off(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

// Singleton
const socketService = new SocketService();
export default socketService;