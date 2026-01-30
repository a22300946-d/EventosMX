const Servicio = require('../models/Servicio');

// Crear nuevo servicio (solo proveedores)
const crearServicio = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id_categoria, nombre_servicio, descripcion, precio, tipo_precio } = req.body;

    // Validar campos requeridos
    if (!id_categoria || !nombre_servicio || !precio || !tipo_precio) {
      return res.status(400).json({
        success: false,
        message: 'Categoría, nombre del servicio, precio y tipo de precio son obligatorios'
      });
    }

    // Validar tipo de precio
    const tiposValidos = ['por hora', 'por evento', 'por persona', 'paquete'];
    if (!tiposValidos.includes(tipo_precio)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de precio inválido. Debe ser: por hora, por evento, por persona o paquete'
      });
    }

    const nuevoServicio = await Servicio.crear({
      id_proveedor,
      id_categoria,
      nombre_servicio,
      descripcion,
      precio,
      tipo_precio
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: nuevoServicio
    });

  } catch (error) {
    console.error('Error en crearServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
      error: error.message
    });
  }
};

// Obtener todos los servicios del proveedor autenticado
const obtenerMisServicios = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const servicios = await Servicio.obtenerPorProveedor(id_proveedor);

    res.json({
      success: true,
      data: servicios,
      total: servicios.length
    });

  } catch (error) {
    console.error('Error en obtenerMisServicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

// Obtener un servicio por ID (público)
const obtenerServicioPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.obtenerPorId(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: servicio
    });

  } catch (error) {
    console.error('Error en obtenerServicioPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
      error: error.message
    });
  }
};

// Buscar servicios con filtros (público)
const buscarServicios = async (req, res) => {
  try {
    const { 
      id_categoria, ciudad, precio_min, precio_max, 
      busqueda, limite 
    } = req.query;

    const servicios = await Servicio.buscarConFiltros({
      id_categoria: id_categoria ? parseInt(id_categoria) : null,
      ciudad,
      precio_min: precio_min ? parseFloat(precio_min) : null,
      precio_max: precio_max ? parseFloat(precio_max) : null,
      busqueda,
      limite: limite ? parseInt(limite) : 20
    });

    res.json({
      success: true,
      data: servicios,
      total: servicios.length
    });

  } catch (error) {
    console.error('Error en buscarServicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar servicios',
      error: error.message
    });
  }
};

// Actualizar servicio (solo el proveedor dueño)
const actualizarServicio = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;
    const { 
      id_categoria, nombre_servicio, descripcion, 
      precio, tipo_precio, disponible 
    } = req.body;

    const servicioActualizado = await Servicio.actualizar(id, id_proveedor, {
      id_categoria,
      nombre_servicio,
      descripcion,
      precio,
      tipo_precio,
      disponible
    });

    if (!servicioActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o no tienes permisos para modificarlo'
      });
    }

    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: servicioActualizado
    });

  } catch (error) {
    console.error('Error en actualizarServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
};

// Eliminar servicio (solo el proveedor dueño)
const eliminarServicio = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;

    const servicioEliminado = await Servicio.eliminar(id, id_proveedor);

    if (!servicioEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o no tienes permisos para eliminarlo'
      });
    }

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio',
      error: error.message
    });
  }
};

// Obtener servicios por categoría (público)
const obtenerServiciosPorCategoria = async (req, res) => {
  try {
    const { id_categoria } = req.params;
    const { limite } = req.query;

    const servicios = await Servicio.obtenerPorCategoria(
      id_categoria, 
      limite ? parseInt(limite) : 20
    );

    res.json({
      success: true,
      data: servicios,
      total: servicios.length
    });

  } catch (error) {
    console.error('Error en obtenerServiciosPorCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

module.exports = {
  crearServicio,
  obtenerMisServicios,
  obtenerServicioPorId,
  buscarServicios,
  actualizarServicio,
  eliminarServicio,
  obtenerServiciosPorCategoria
};
