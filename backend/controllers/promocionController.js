const Promocion = require('../models/Promocion');
const { LIMITES, MENSAJES } = require('../config/constantes');

// Crear nueva promoción (proveedor)
const crearPromocion = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { 
      titulo, descripcion, precio_original, precio_promocional,
      fecha_inicio, fecha_fin 
    } = req.body;

    // Validar campos requeridos
    if (!titulo || !precio_original || !precio_promocional || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Título, precios y fechas son obligatorios'
      });
    }

    // Validar que el precio promocional sea menor al original
    if (parseFloat(precio_promocional) >= parseFloat(precio_original)) {
      return res.status(400).json({
        success: false,
        message: 'El precio promocional debe ser menor al precio original'
      });
    }

    // Validar que la fecha fin sea mayor a la fecha inicio
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    
    if (fechaFin <= fechaInicio) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin debe ser posterior a la fecha de inicio'
      });
    }

    // Calcular porcentaje de descuento
    const porcentaje_descuento = Math.round(
      ((precio_original - precio_promocional) / precio_original) * 100
    );

    // Intentar crear la promoción
    let nuevaPromocion;
    try {
      nuevaPromocion = await Promocion.crear({
        id_proveedor,
        titulo,
        descripcion,
        precio_original,
        precio_promocional,
        porcentaje_descuento,
        fecha_inicio,
        fecha_fin
      });
    } catch (error) {
      if (error.message.startsWith('LIMITE_EXCEDIDO')) {
        const limite = error.message.split(':')[1];
        return res.status(400).json({
          success: false,
          message: `Has alcanzado el límite máximo de ${limite} promociones activas`,
          codigo: 'LIMITE_EXCEDIDO',
          limite_maximo: parseInt(limite)
        });
      }
      throw error;
    }

    const infoLimite = await Promocion.obtenerInfoLimite(id_proveedor);

    res.status(201).json({
      success: true,
      message: 'Promoción creada exitosamente',
      data: nuevaPromocion,
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en crearPromocion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear promoción',
      error: error.message
    });
  }
};

// Obtener mis promociones (proveedor)
const obtenerMisPromociones = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { solo_activas } = req.query;

    const promociones = await Promocion.obtenerPorProveedor(
      id_proveedor, 
      solo_activas === 'true'
    );
    
    const infoLimite = await Promocion.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      data: promociones,
      total: promociones.length,
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en obtenerMisPromociones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
};

// Obtener promociones de un proveedor (público)
const obtenerPromocionesProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    const promociones = await Promocion.obtenerPorProveedor(id_proveedor, true);

    res.json({
      success: true,
      data: promociones,
      total: promociones.length
    });

  } catch (error) {
    console.error('Error en obtenerPromocionesProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promociones',
      error: error.message
    });
  }
};

// Buscar promociones activas (público)
const buscarPromociones = async (req, res) => {
  try {
    const { ciudad, precio_max, porcentaje_min, limite } = req.query;

    const promociones = await Promocion.buscarActivas({
      ciudad,
      precio_max: precio_max ? parseFloat(precio_max) : null,
      porcentaje_min: porcentaje_min ? parseInt(porcentaje_min) : null,
      limite: limite ? parseInt(limite) : 20
    });

    res.json({
      success: true,
      data: promociones,
      total: promociones.length
    });

  } catch (error) {
    console.error('Error en buscarPromociones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar promociones',
      error: error.message
    });
  }
};

// Obtener promoción por ID (público)
const obtenerPromocionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const promocion = await Promocion.obtenerPorId(id);

    if (!promocion) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada'
      });
    }

    // Verificar si está vigente
    const vigente = await Promocion.estaVigente(id);

    res.json({
      success: true,
      data: {
        ...promocion,
        vigente
      }
    });

  } catch (error) {
    console.error('Error en obtenerPromocionPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener promoción',
      error: error.message
    });
  }
};

// Actualizar promoción (proveedor)
const actualizarPromocion = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;
    const { 
      titulo, descripcion, precio_original, precio_promocional,
      fecha_inicio, fecha_fin, activo 
    } = req.body;

    // Si se actualizan los precios, recalcular el porcentaje
    let porcentaje_descuento = null;
    if (precio_original && precio_promocional) {
      if (parseFloat(precio_promocional) >= parseFloat(precio_original)) {
        return res.status(400).json({
          success: false,
          message: 'El precio promocional debe ser menor al precio original'
        });
      }
      porcentaje_descuento = Math.round(
        ((precio_original - precio_promocional) / precio_original) * 100
      );
    }

    const promocionActualizada = await Promocion.actualizar(id, id_proveedor, {
      titulo,
      descripcion,
      precio_original,
      precio_promocional,
      porcentaje_descuento,
      fecha_inicio,
      fecha_fin,
      activo
    });

    if (!promocionActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada o no tienes permiso para modificarla'
      });
    }

    res.json({
      success: true,
      message: 'Promoción actualizada exitosamente',
      data: promocionActualizada
    });

  } catch (error) {
    console.error('Error en actualizarPromocion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar promoción',
      error: error.message
    });
  }
};

// Desactivar promoción (proveedor)
const desactivarPromocion = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;

    const promocionDesactivada = await Promocion.desactivar(id, id_proveedor);

    if (!promocionDesactivada) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada o no tienes permiso'
      });
    }

    const infoLimite = await Promocion.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      message: 'Promoción desactivada exitosamente',
      data: promocionDesactivada,
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en desactivarPromocion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al desactivar promoción',
      error: error.message
    });
  }
};

// Eliminar promoción (proveedor)
const eliminarPromocion = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;

    const promocionEliminada = await Promocion.eliminar(id, id_proveedor);

    if (!promocionEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Promoción no encontrada o no tienes permiso para eliminarla'
      });
    }

    const infoLimite = await Promocion.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      message: 'Promoción eliminada exitosamente',
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en eliminarPromocion:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar promoción',
      error: error.message
    });
  }
};

// Obtener información del límite
const obtenerInfoLimite = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const infoLimite = await Promocion.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      data: infoLimite
    });

  } catch (error) {
    console.error('Error en obtenerInfoLimite:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del límite',
      error: error.message
    });
  }
};

module.exports = {
  crearPromocion,
  obtenerMisPromociones,
  obtenerPromocionesProveedor,
  buscarPromociones,
  obtenerPromocionPorId,
  actualizarPromocion,
  desactivarPromocion,
  eliminarPromocion,
  obtenerInfoLimite
};
