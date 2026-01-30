const Resena = require('../models/Resena');
const Solicitud = require('../models/Solicitud');
const { analizarSentimiento } = require('../utils/sentimentAnalysis');

// Crear nueva reseña (cliente)
const crearResena = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_proveedor, id_solicitud, comentario } = req.body;

    // Validar campos requeridos
    if (!id_proveedor || !id_solicitud || !comentario) {
      return res.status(400).json({
        success: false,
        message: 'Proveedor, solicitud y comentario son obligatorios'
      });
    }

    // Verificar que la solicitud existe y está aceptada
    const solicitud = await Solicitud.obtenerPorId(id_solicitud);
    
    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (solicitud.id_cliente !== id_cliente) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para dejar reseña en esta solicitud'
      });
    }

    if (solicitud.estado !== 'Aceptada') {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes dejar reseñas en solicitudes aceptadas'
      });
    }

    // Verificar que el evento ya pasó
    const fechaEvento = new Date(solicitud.fecha_evento);
    const hoy = new Date();
    
    if (fechaEvento > hoy) {
      return res.status(400).json({
        success: false,
        message: 'Solo puedes dejar reseñas después de que el evento haya ocurrido'
      });
    }

    // Verificar que no haya dejado reseña ya
    const yaReseno = await Resena.existeResena(id_cliente, id_solicitud);
    
    if (yaReseno) {
      return res.status(400).json({
        success: false,
        message: 'Ya has dejado una reseña para esta solicitud'
      });
    }

    // Analizar sentimiento del comentario
    console.log('Analizando sentimiento del comentario...');
    const analisis = await analizarSentimiento(comentario);
    
    console.log('Resultado del análisis:', analisis);

    // Crear la reseña
    const nuevaResena = await Resena.crear({
      id_cliente,
      id_proveedor,
      id_solicitud,
      comentario,
      calificacion: analisis.calificacion,
      sentimiento: analisis.sentimiento
    });

    res.status(201).json({
      success: true,
      message: 'Reseña publicada exitosamente',
      data: {
        resena: nuevaResena,
        analisis: {
          sentimiento: analisis.sentimiento,
          calificacion: analisis.calificacion,
          score: analisis.score
        }
      }
    });

  } catch (error) {
    console.error('Error en crearResena:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear reseña',
      error: error.message
    });
  }
};

// Obtener reseñas de un proveedor (público)
const obtenerResenasProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { sentimiento, calificacion_min, limite } = req.query;

    const resenas = await Resena.obtenerPorProveedor(id_proveedor, {
      sentimiento,
      calificacion_min: calificacion_min ? parseFloat(calificacion_min) : null,
      limite: limite ? parseInt(limite) : 20
    });

    const estadisticas = await Resena.obtenerEstadisticas(id_proveedor);

    res.json({
      success: true,
      data: resenas,
      estadisticas: {
        total: parseInt(estadisticas.total_resenas),
        promedio: parseFloat(estadisticas.calificacion_promedio || 0).toFixed(2),
        positivas: parseInt(estadisticas.positivas),
        neutras: parseInt(estadisticas.neutras),
        negativas: parseInt(estadisticas.negativas)
      }
    });

  } catch (error) {
    console.error('Error en obtenerResenasProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas',
      error: error.message
    });
  }
};

// Obtener una reseña por ID
const obtenerResenaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const resena = await Resena.obtenerPorId(id);

    if (!resena) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    res.json({
      success: true,
      data: resena
    });

  } catch (error) {
    console.error('Error en obtenerResenaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseña',
      error: error.message
    });
  }
};

// Reportar reseña
const reportarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un motivo para el reporte'
      });
    }

    const resenaReportada = await Resena.reportar(id, motivo);

    if (!resenaReportada) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Reseña reportada exitosamente. Será revisada por un administrador.',
      data: resenaReportada
    });

  } catch (error) {
    console.error('Error en reportarResena:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reportar reseña',
      error: error.message
    });
  }
};

// Eliminar mi reseña (cliente)
const eliminarMiResena = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;

    const resenaEliminada = await Resena.eliminar(id, id_cliente);

    if (!resenaEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada o no tienes permiso para eliminarla'
      });
    }

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarMiResena:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar reseña',
      error: error.message
    });
  }
};

module.exports = {
  crearResena,
  obtenerResenasProveedor,
  obtenerResenaPorId,
  reportarResena,
  eliminarMiResena
};
