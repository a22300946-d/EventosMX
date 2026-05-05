const Mensaje = require('../models/Mensaje');

// Obtener mensajes de una solicitud
const obtenerMensajes = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const id_usuario = req.usuario.id;
    
    // Soportar tanto 'tipo' como 'rol' en el token
    const tipo_usuario = req.usuario.tipo || req.usuario.rol;

    if (!tipo_usuario) {
      console.error('❌ Token no tiene campo tipo ni rol:', req.usuario);
      return res.status(400).json({
        success: false,
        message: 'Token inválido: falta información de tipo de usuario'
      });
    }

    console.log('🔍 Verificando acceso:', {
      id_solicitud,
      id_usuario,
      tipo_usuario
    });

    // Verificar que el usuario tenga acceso a esta conversación
    const tieneAcceso = await Mensaje.verificarAcceso(
      id_solicitud,
      id_usuario,
      tipo_usuario
    );

    if (!tieneAcceso) {
      console.log('❌ Acceso denegado para usuario:', id_usuario, tipo_usuario);
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta conversación'
      });
    }

    // Obtener los mensajes
    const mensajes = await Mensaje.obtenerPorSolicitud(id_solicitud);

    console.log('✅ Mensajes obtenidos:', mensajes.length);

    res.json({
      success: true,
      data: mensajes
    });

  } catch (error) {
    console.error('Error en obtenerMensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes',
      error: error.message
    });
  }
};

// Enviar un nuevo mensaje
const enviarMensaje = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const { contenido } = req.body;
    const id_usuario = req.usuario.id;
    const tipo_usuario = req.usuario.tipo || req.usuario.rol;

    // Validar que haya contenido
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    // Verificar acceso
    const tieneAcceso = await Mensaje.verificarAcceso(
      id_solicitud,
      id_usuario,
      tipo_usuario
    );

    if (!tieneAcceso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para enviar mensajes en esta conversación'
      });
    }

    // Crear el mensaje
    const nuevoMensaje = await Mensaje.crear({
      id_solicitud,
      id_remitente: id_usuario,
      tipo_remitente: tipo_usuario,
      contenido: contenido.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: nuevoMensaje
    });

  } catch (error) {
    console.error('Error en enviarMensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje',
      error: error.message
    });
  }
};

// Marcar mensajes como leídos
const marcarComoLeidos = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const id_usuario = req.usuario.id;
    const tipo_usuario = req.usuario.tipo || req.usuario.rol;

    if (!tipo_usuario) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido: falta información de tipo de usuario'
      });
    }

    console.log('🔍 Marcando como leídos:', {
      id_solicitud,
      id_usuario,
      tipo_usuario
    });

    // Verificar acceso
    const tieneAcceso = await Mensaje.verificarAcceso(
      id_solicitud,
      id_usuario,
      tipo_usuario
    );

    if (!tieneAcceso) {
      console.log('❌ Acceso denegado para marcar como leídos');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta conversación'
      });
    }

    // Marcar todos los mensajes como leídos
    const mensajesActualizados = await Mensaje.marcarTodosComoLeidos(
      id_solicitud,
      tipo_usuario,
      id_usuario
    );

    console.log('✅ Mensajes marcados como leídos:', mensajesActualizados.length);

    res.json({
      success: true,
      message: 'Mensajes marcados como leídos',
      data: {
        mensajes_actualizados: mensajesActualizados.length
      }
    });

  } catch (error) {
    console.error('Error en marcarComoLeidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes como leídos',
      error: error.message
    });
  }
};

// Obtener conversaciones activas del usuario
const obtenerConversaciones = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const tipo_usuario = req.usuario.tipo || req.usuario.rol;

    if (!tipo_usuario) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido: falta información de tipo de usuario'
      });
    }

    const conversaciones = await Mensaje.obtenerConversacionesActivas(
      id_usuario,
      tipo_usuario
    );

    res.json({
      success: true,
      data: conversaciones
    });

  } catch (error) {
    console.error('Error en obtenerConversaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conversaciones',
      error: error.message
    });
  }
};

// Contar mensajes no leídos
const contarNoLeidos = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;
    const tipo_usuario = req.usuario.tipo || req.usuario.rol;

    const total = await Mensaje.contarNoLeidos(id_usuario, tipo_usuario);

    res.json({
      success: true,
      data: {
        total_no_leidos: total
      }
    });

  } catch (error) {
    console.error('Error en contarNoLeidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar mensajes no leídos',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMensajes,
  enviarMensaje,
  marcarComoLeidos,
  obtenerConversaciones,
  contarNoLeidos
};