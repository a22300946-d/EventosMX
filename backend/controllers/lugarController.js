const Lugar = require('../models/Lugar');

// Obtener ciudades de la databse
const obtenerLugares = async (req, res) => {
  try {
    const lugares = await Lugar.obtenerTodos();

    res.json({
      success: true,
      data: lugares
    });
  } catch (error) {
    console.error('Error al obtener lugares:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lugares'
    });
  }
};

module.exports = {
  obtenerLugares
};
