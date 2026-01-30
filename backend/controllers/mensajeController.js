const Mensaje = require('../models/Mensaje');
const Solicitud = require('../models/Solicitud');
const pool = require('../config/database');

// Enviar mensaje
const enviarMensaje = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const { contenido } = req.body;
    const usuario = req.usuario;

    // Validar contenido
    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El contenido del mensaje es obligatorio'
      });
    }

    // Verificar que la solicitud existe
    const solicitud = await Solicitud.obtenerPorId(id_solicitud);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que el usuario tenga permiso para enviar mensajes en esta solicitud
    const tienePermiso = 
      (usuario.rol === 'cliente' && solicitud.id_cliente === usuario.id) ||
      (usuario.rol === 'proveedor' && solicitud.id_proveedor === usuario.id);

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para enviar mensajes en esta conversación'
      });
    }

    // Verificar que la solicitud no esté cancelada
    if (solicitud.estado === 'Cancelada') {
      return res.status(400).json({
        success: false,
        message: 'No se pueden enviar mensajes en solicitudes canceladas'
      });
    }

    // NUEVO: Marcar como leídos todos los mensajes anteriores del otro usuario
    await Mensaje.marcarComoLeido(id_solicitud, usuario.id, usuario.rol);

    // Crear el nuevo mensaje
    const nuevoMensaje = await Mensaje.crear({
      id_solicitud,
      id_remitente: usuario.id,
      tipo_remitente: usuario.rol,
      contenido: contenido.trim()
    });

    // Obtener información del remitente para la respuesta
    const mensajeConInfo = await pool.query(`
      SELECT m.*,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.nombre_completo
          WHEN m.tipo_remitente = 'proveedor' THEN p.nombre_negocio
        END as nombre_remitente,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.foto_perfil
          WHEN m.tipo_remitente = 'proveedor' THEN p.logo
        END as foto_remitente
      FROM Mensaje m
      LEFT JOIN Cliente c ON m.tipo_remitente = 'cliente' AND m.id_remitente = c.id_cliente
      LEFT JOIN Proveedor p ON m.tipo_remitente = 'proveedor' AND m.id_remitente = p.id_proveedor
      WHERE m.id_mensaje = $1
    `, [nuevoMensaje.id_mensaje]);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: mensajeConInfo.rows[0]
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

// Obtener mensajes de una solicitud (chat completo)
const obtenerMensajes = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const usuario = req.usuario;

    // Verificar que la solicitud existe
    const solicitud = await Solicitud.obtenerPorId(id_solicitud);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar permisos
    const tienePermiso = 
      (usuario.rol === 'cliente' && solicitud.id_cliente === usuario.id) ||
      (usuario.rol === 'proveedor' && solicitud.id_proveedor === usuario.id);

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta conversación'
      });
    }

    // Obtener mensajes
    const mensajes = await Mensaje.obtenerPorSolicitud(id_solicitud);

    // Marcar mensajes como leídos
    await Mensaje.marcarComoLeido(id_solicitud, usuario.id, usuario.rol);

    res.json({
      success: true,
      data: mensajes,
      total: mensajes.length
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

// Obtener lista de conversaciones
const obtenerConversaciones = async (req, res) => {
  try {
    const usuario = req.usuario;
    
    let conversaciones;

    if (usuario.rol === 'cliente') {
      conversaciones = await Mensaje.obtenerConversacionesCliente(usuario.id);
    } else if (usuario.rol === 'proveedor') {
      conversaciones = await Mensaje.obtenerConversacionesProveedor(usuario.id);
    }

    res.json({
      success: true,
      data: conversaciones,
      total: conversaciones.length
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

// Marcar mensajes como leídos
const marcarComoLeido = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const usuario = req.usuario;

    // Verificar que la solicitud existe
    const solicitud = await Solicitud.obtenerPorId(id_solicitud);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar permisos
    const tienePermiso = 
      (usuario.rol === 'cliente' && solicitud.id_cliente === usuario.id) ||
      (usuario.rol === 'proveedor' && solicitud.id_proveedor === usuario.id);

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar estos mensajes'
      });
    }

    const mensajesActualizados = await Mensaje.marcarComoLeido(
      id_solicitud, 
      usuario.id, 
      usuario.rol
    );

    res.json({
      success: true,
      message: 'Mensajes marcados como leídos',
      data: {
        mensajes_actualizados: mensajesActualizados.length
      }
    });

  } catch (error) {
    console.error('Error en marcarComoLeido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes',
      error: error.message
    });
  }
};

// Contar mensajes no leídos
const contarNoLeidos = async (req, res) => {
  try {
    const { id_solicitud } = req.params;
    const usuario = req.usuario;

    const total = await Mensaje.contarNoLeidos(id_solicitud, usuario.id, usuario.rol);

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
      message: 'Error al contar mensajes',
      error: error.message
    });
  }
};

// Eliminar mensaje
const eliminarMensaje = async (req, res) => {
  try {
    const { id_mensaje } = req.params;
    const usuario = req.usuario;

    const mensajeEliminado = await Mensaje.eliminar(
      id_mensaje, 
      usuario.id, 
      usuario.rol
    );

    if (!mensajeEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Mensaje no encontrado o no se puede eliminar (solo mensajes enviados hace menos de 5 minutos)'
      });
    }

    res.json({
      success: true,
      message: 'Mensaje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarMensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar mensaje',
      error: error.message
    });
  }
};

module.exports = {
  enviarMensaje,
  obtenerMensajes,
  obtenerConversaciones,
  marcarComoLeido,
  contarNoLeidos,
  eliminarMensaje
};