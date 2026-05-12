const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Mensaje = require('../models/Mensaje');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Middleware de autenticación para Socket.IO
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.error('❌ Socket: No se proporcionó token');
        return next(new Error('No se proporcionó token de autenticación'));
      }

      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      socket.userId = decoded.id;
      // Soportar tanto 'tipo' como 'rol'
      socket.userType = decoded.tipo || decoded.rol;
      
      if (!socket.userType) {
        console.error('❌ Socket: Token no tiene tipo ni rol:', decoded);
        return next(new Error('Token inválido: falta tipo de usuario'));
      }
      
      console.log('✅ Socket autenticado:', socket.userType, socket.userId);
      next();
    } catch (error) {
      console.error('❌ Error en autenticación de socket:', error.message);
      next(new Error('Token inválido'));
    }
  });

  // Manejar conexiones
  io.on('connection', (socket) => {
    console.log(`✅ Usuario conectado: ${socket.userType}_${socket.userId}`);

    // Unirse a una sala de conversación
    socket.on('join_conversation', async (id_solicitud) => {
      try {
        // Verificar que el usuario tenga acceso
        const tieneAcceso = await Mensaje.verificarAcceso(
          id_solicitud,
          socket.userId,
          socket.userType
        );

        if (!tieneAcceso) {
          socket.emit('error', { message: 'No tienes acceso a esta conversación' });
          return;
        }

        // Unirse a la sala
        const roomName = `solicitud_${id_solicitud}`;
        socket.join(roomName);
        
        // También unirse a sala personal para notificaciones
        socket.join(`user_${socket.userType}_${socket.userId}`);

        console.log(`Usuario ${socket.userType}_${socket.userId} se unió a ${roomName}`);
        
        socket.emit('joined_conversation', { id_solicitud });

      } catch (error) {
        console.error('Error al unirse a conversación:', error);
        socket.emit('error', { message: 'Error al unirse a la conversación' });
      }
    });

    // Salir de una conversación
    socket.on('leave_conversation', (id_solicitud) => {
      const roomName = `solicitud_${id_solicitud}`;
      socket.leave(roomName);
      console.log(`Usuario ${socket.userType}_${socket.userId} salió de ${roomName}`);
    });

    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { id_solicitud, contenido } = data;

        // Verificar acceso
        const tieneAcceso = await Mensaje.verificarAcceso(
          id_solicitud,
          socket.userId,
          socket.userType
        );

        if (!tieneAcceso) {
          socket.emit('message_error', { message: 'No tienes acceso a esta conversación' });
          return;
        }

        // Crear el mensaje en la base de datos
        const nuevoMensaje = await Mensaje.crear({
          id_solicitud,
          id_remitente: socket.userId,
          tipo_remitente: socket.userType,
          contenido
        });

        // Emitir el mensaje a todos en la sala
        const roomName = `solicitud_${id_solicitud}`;
        io.to(roomName).emit('new_message', nuevoMensaje);

        console.log(`Mensaje enviado en ${roomName}`);

      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('message_error', { message: 'Error al enviar mensaje' });
      }
    });

    // Marcar mensajes como leídos
    socket.on('mark_as_read', async (data) => {
      try {
        const { id_solicitud } = data;

        // Verificar acceso
        const tieneAcceso = await Mensaje.verificarAcceso(
          id_solicitud,
          socket.userId,
          socket.userType
        );

        if (!tieneAcceso) {
          return;
        }

        // Marcar como leídos
        await Mensaje.marcarTodosComoLeidos(
          id_solicitud,
          socket.userType,
          socket.userId
        );

        // Notificar a la sala que los mensajes fueron leídos
        const roomName = `solicitud_${id_solicitud}`;
        io.to(roomName).emit('messages_read', {
          id_solicitud,
          read_by_type: socket.userType,
          read_by_id: socket.userId
        });

      } catch (error) {
        console.error('Error al marcar como leído:', error);
      }
    });

    // Usuario está escribiendo
    socket.on('typing', (data) => {
      const { id_solicitud } = data;
      const roomName = `solicitud_${id_solicitud}`;
      
      socket.to(roomName).emit('user_typing', {
        id_solicitud,
        user_type: socket.userType,
        user_id: socket.userId
      });
    });

    // Usuario dejó de escribir
    socket.on('stop_typing', (data) => {
      const { id_solicitud } = data;
      const roomName = `solicitud_${id_solicitud}`;
      
      socket.to(roomName).emit('user_stop_typing', {
        id_solicitud,
        user_type: socket.userType,
        user_id: socket.userId
      });
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.userType}_${socket.userId}`);
    });
  });

  return io;
};

// Función auxiliar para emitir notificaciones
const emitNotification = (userId, userType, event, data) => {
  if (io) {
    io.to(`user_${userType}_${userId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  emitNotification,
  getIO: () => io
}; 