const Preferencia = require('../models/Preferencia');
const RecomendacionService = require('../services/recomendacionService');

// Guardar o actualizar preferencias del cliente
const guardarPreferencias = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { tipos_eventos, servicios_preferidos, ubicacion_preferida, precio_min, precio_max } = req.body;

    // Validar que al menos un campo esté presente
    if (!tipos_eventos && !servicios_preferidos && !ubicacion_preferida && !precio_min && !precio_max) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar al menos una preferencia'
      });
    }

    const preferencias = await Preferencia.guardarPreferencias(id_cliente, {
      tipos_eventos,
      servicios_preferidos,
      ubicacion_preferida,
      precio_min,
      precio_max
    });

    res.json({
      success: true,
      message: 'Preferencias guardadas exitosamente',
      data: preferencias
    });

  } catch (error) {
    console.error('Error en guardarPreferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar preferencias',
      error: error.message
    });
  }
};

// Obtener preferencias del cliente autenticado
const obtenerPreferencias = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    const preferencias = await Preferencia.obtenerPorCliente(id_cliente);

    if (!preferencias) {
      return res.json({
        success: true,
        message: 'No se han configurado preferencias aún',
        data: null
      });
    }

    res.json({
      success: true,
      data: preferencias
    });

  } catch (error) {
    console.error('Error en obtenerPreferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preferencias',
      error: error.message
    });
  }
};

// Obtener proveedores recomendados
const obtenerRecomendaciones = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const limite = parseInt(req.query.limite) || 20;

    const recomendaciones = await RecomendacionService.obtenerRecomendaciones(id_cliente, limite);

    res.json({
      success: true,
      message: recomendaciones.length > 0 
        ? 'Recomendaciones obtenidas exitosamente' 
        : 'No hay proveedores disponibles',
      data: recomendaciones,
      total: recomendaciones.length
    });

  } catch (error) {
    console.error('Error en obtenerRecomendaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener recomendaciones',
      error: error.message
    });
  }
};

// Eliminar preferencias
const eliminarPreferencias = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    await Preferencia.eliminar(id_cliente);

    res.json({
      success: true,
      message: 'Preferencias eliminadas exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarPreferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar preferencias',
      error: error.message
    });
  }
};

module.exports = {
  guardarPreferencias,
  obtenerPreferencias,
  obtenerRecomendaciones,
  eliminarPreferencias
};