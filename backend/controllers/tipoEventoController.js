// backend/controllers/tipoEventoController.js
const TipoEvento = require('../models/TipoEvento');

const obtenerTiposEventos = async (req, res) => {
  try {
    const tiposEventos = await TipoEvento.obtenerTodos();
    
    res.status(200).json({
      success: true,
      data: tiposEventos,
      message: 'Tipos de eventos obtenidos exitosamente'
    });
  } catch (error) {
    console.error('Error al obtener tipos de eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de eventos',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTiposEventos
};