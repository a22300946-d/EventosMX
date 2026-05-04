const ProveedorEvento = require('../models/ProveedorEvento');

// Obtener todos los tipos de eventos disponibles
const obtenerTiposEventos = async (req, res) => {
  try {
    const tiposEventos = await ProveedorEvento.obtenerTiposEventos();

    res.json({
      success: true,
      data: tiposEventos,
    });
  } catch (error) {
    console.error('Error en obtenerTiposEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de eventos',
      error: error.message,
    });
  }
};

// Obtener eventos de un proveedor específico
const obtenerEventosDeProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    const eventos = await ProveedorEvento.obtenerEventosDeProveedor(id_proveedor);

    res.json({
      success: true,
      data: eventos,
    });
  } catch (error) {
    console.error('Error en obtenerEventosDeProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del proveedor',
      error: error.message,
    });
  }
};

// Obtener MIS eventos (proveedor autenticado)
const obtenerMisEventos = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const eventos = await ProveedorEvento.obtenerEventosDeProveedor(id_proveedor);

    res.json({
      success: true,
      data: eventos,
    });
  } catch (error) {
    console.error('Error en obtenerMisEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mis eventos',
      error: error.message,
    });
  }
};

// Agregar evento a mi perfil
const agregarEvento = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id_tipo_evento } = req.body;

    if (!id_tipo_evento) {
      return res.status(400).json({
        success: false,
        message: 'El id_tipo_evento es obligatorio',
      });
    }

    const eventoAgregado = await ProveedorEvento.agregarEventoAProveedor(
      id_proveedor,
      id_tipo_evento
    );

    res.status(201).json({
      success: true,
      message: 'Tipo de evento agregado exitosamente',
      data: eventoAgregado,
    });
  } catch (error) {
    console.error('Error en agregarEvento:', error);

    if (error.message === 'Este tipo de evento ya está agregado') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al agregar tipo de evento',
      error: error.message,
    });
  }
};

// Eliminar evento de mi perfil
const eliminarEvento = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id_tipo_evento } = req.params;

    const eventoEliminado = await ProveedorEvento.eliminarEventoDeProveedor(
      id_proveedor,
      id_tipo_evento
    );

    if (!eventoEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de evento no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Tipo de evento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en eliminarEvento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de evento',
      error: error.message,
    });
  }
};

// Actualizar todos mis eventos (reemplazar)
const actualizarMisEventos = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { ids_tipos_eventos } = req.body;

    if (!Array.isArray(ids_tipos_eventos)) {
      return res.status(400).json({
        success: false,
        message: 'ids_tipos_eventos debe ser un array',
      });
    }

    const eventosActualizados = await ProveedorEvento.actualizarEventosDeProveedor(
      id_proveedor,
      ids_tipos_eventos
    );

    res.json({
      success: true,
      message: 'Tipos de eventos actualizados exitosamente',
      data: eventosActualizados,
    });
  } catch (error) {
    console.error('Error en actualizarMisEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipos de eventos',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerTiposEventos,
  obtenerEventosDeProveedor,
  obtenerMisEventos,
  agregarEvento,
  eliminarEvento,
  actualizarMisEventos,
};