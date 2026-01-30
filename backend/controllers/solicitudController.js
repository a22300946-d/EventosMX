const Solicitud = require('../models/Solicitud');

// Crear nueva solicitud (cliente)
const crearSolicitud = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { 
      id_proveedor, 
      fecha_evento, 
      numero_invitados,
      tipo_evento, 
      presupuesto_estimado, 
      descripcion_solicitud,
      servicios_solicitados 
    } = req.body;

    // Validar campos requeridos
    if (!id_proveedor || !fecha_evento || !tipo_evento) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor, fecha del evento y tipo de evento son obligatorios'
      });
    }

    // Validar que la fecha del evento sea futura
    const fechaEvento = new Date(fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaEvento < hoy) {
      return res.status(400).json({
        success: false,
        message: 'La fecha del evento debe ser futura'
      });
    }

    // Validar servicios si se proporcionan
    if (servicios_solicitados && !Array.isArray(servicios_solicitados)) {
      return res.status(400).json({
        success: false,
        message: 'Los servicios solicitados deben ser un array'
      });
    }

    const nuevaSolicitud = await Solicitud.crear({
      id_cliente,
      id_proveedor,
      fecha_evento,
      numero_invitados,
      tipo_evento,
      presupuesto_estimado,
      descripcion_solicitud,
      servicios_solicitados 
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada exitosamente',
      data: nuevaSolicitud
    });

  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear solicitud',
      error: error.message
    });
  }
};

// Obtener solicitudes del cliente autenticado
const obtenerMisSolicitudes = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { estado, limite } = req.query;

    const solicitudes = await Solicitud.obtenerPorCliente(id_cliente, {
      estado,
      limite: limite ? parseInt(limite) : null
    });

    res.json({
      success: true,
      data: solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('Error en obtenerMisSolicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener solicitudes recibidas por el proveedor
const obtenerSolicitudesRecibidas = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { estado, limite } = req.query;

    const solicitudes = await Solicitud.obtenerPorProveedor(id_proveedor, {
      estado,
      limite: limite ? parseInt(limite) : null
    });

    res.json({
      success: true,
      data: solicitudes,
      total: solicitudes.length
    });

  } catch (error) {
    console.error('Error en obtenerSolicitudesRecibidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitudes',
      error: error.message
    });
  }
};

// Obtener detalle de una solicitud
const obtenerSolicitudPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.usuario;

    const solicitud = await Solicitud.obtenerPorId(id);

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    // Verificar que el usuario tenga permiso para ver esta solicitud
    const tienePermiso = 
      (usuario.rol === 'cliente' && solicitud.id_cliente === usuario.id) ||
      (usuario.rol === 'proveedor' && solicitud.id_proveedor === usuario.id);

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta solicitud'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });

  } catch (error) {
    console.error('Error en obtenerSolicitudPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener solicitud',
      error: error.message
    });
  }
};


// Responder solicitud con propuesta (proveedor)
const responderSolicitud = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;
    const { 
      mensaje_respuesta, 
      precio_propuesto, 
      detalles_servicio,
      fecha_disponible 
    } = req.body;

    // Validar campos requeridos
    if (!mensaje_respuesta || !precio_propuesto) {
      return res.status(400).json({
        success: false,
        message: 'Mensaje de respuesta y precio propuesto son obligatorios'
      });
    }

    // Primero verificar que la solicitud existe y pertenece a este proveedor
    const solicitudExistente = await Solicitud.obtenerPorId(id);
    
    if (!solicitudExistente) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitudExistente.id_proveedor !== id_proveedor) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para responder esta solicitud'
      });
    }

    if (solicitudExistente.estado !== 'Pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden responder solicitudes pendientes'
      });
    }

    const solicitudActualizada = await Solicitud.responderConPropuesta(
      id,
      id_proveedor,
      {
        mensaje_respuesta,
        precio_propuesto,
        detalles_servicio,
        fecha_disponible
      }
    );

    res.json({
      success: true,
      message: 'Propuesta enviada exitosamente al cliente',
      data: solicitudActualizada
    });

  } catch (error) {
    console.error('Error en responderSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al responder solicitud',
      error: error.message
    });
  }
};


// Aceptar propuesta del proveedor (cliente)
const aceptarSolicitud = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;

    // Verificar que la solicitud existe
    const solicitudExistente = await Solicitud.obtenerPorId(id);
    
    if (!solicitudExistente) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitudExistente.id_cliente !== id_cliente) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para aceptar esta solicitud'
      });
    }

    if (solicitudExistente.estado !== 'Respondida') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden aceptar solicitudes que han sido respondidas por el proveedor'
      });
    }

    const solicitudActualizada = await Solicitud.actualizarEstado(
      id, 
      'Aceptada', 
      id_cliente, 
      'cliente'
    );

    res.json({
      success: true,
      message: 'Propuesta aceptada. Se enviará confirmación por correo a ambas partes.',
      data: solicitudActualizada
    });

  } catch (error) {
    console.error('Error en aceptarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar solicitud',
      error: error.message
    });
  }
};

// Rechazar solicitud (cliente o proveedor)
const rechazarSolicitud = async (req, res) => {
  try {
    const usuario = req.usuario;
    const { id } = req.params;

    const solicitudActualizada = await Solicitud.actualizarEstado(
      id, 
      'Rechazada', 
      usuario.id, 
      usuario.rol
    );

    if (!solicitudActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o no tienes permiso'
      });
    }

    res.json({
      success: true,
      message: 'Solicitud rechazada',
      data: solicitudActualizada
    });

  } catch (error) {
    console.error('Error en rechazarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar solicitud',
      error: error.message
    });
  }
};

// Cancelar solicitud (solo cliente y solo si está Pendiente)
const cancelarSolicitud = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;

    const solicitudEliminada = await Solicitud.eliminar(id, id_cliente);

    if (!solicitudEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o no se puede cancelar (solo solicitudes pendientes)'
      });
    }

    res.json({
      success: true,
      message: 'Solicitud cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error en cancelarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar solicitud',
      error: error.message
    });
  }
};

// Obtener estadísticas de solicitudes (para el dashboard)
const obtenerEstadisticas = async (req, res) => {
  try {
    const usuario = req.usuario;
    
    let estadisticas;

    if (usuario.rol === 'cliente') {
      const todasSolicitudes = await Solicitud.obtenerPorCliente(usuario.id);
      
      estadisticas = {
        total: todasSolicitudes.length,
        pendientes: todasSolicitudes.filter(s => s.estado === 'Pendiente').length,
        respondidas: todasSolicitudes.filter(s => s.estado === 'Respondida').length,
        aceptadas: todasSolicitudes.filter(s => s.estado === 'Aceptada').length,
        rechazadas: todasSolicitudes.filter(s => s.estado === 'Rechazada').length
      };
    } else if (usuario.rol === 'proveedor') {
      const todasSolicitudes = await Solicitud.obtenerPorProveedor(usuario.id);
      
      estadisticas = {
        total: todasSolicitudes.length,
        pendientes: todasSolicitudes.filter(s => s.estado === 'Pendiente').length,
        respondidas: todasSolicitudes.filter(s => s.estado === 'Respondida').length,
        aceptadas: todasSolicitudes.filter(s => s.estado === 'Aceptada').length,
        rechazadas: todasSolicitudes.filter(s => s.estado === 'Rechazada').length
      };
    }

    res.json({
      success: true,
      data: estadisticas
    });

  } catch (error) {
    console.error('Error en obtenerEstadisticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  crearSolicitud,
  obtenerMisSolicitudes,
  obtenerSolicitudesRecibidas,
  obtenerSolicitudPorId,
  responderSolicitud,
  aceptarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  obtenerEstadisticas
};