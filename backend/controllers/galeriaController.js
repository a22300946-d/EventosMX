const Galeria = require('../models/Galeria');
const { LIMITES, MENSAJES } = require('../config/constantes');

// Obtener galería de un proveedor (público)
const obtenerGaleriaProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    const fotos = await Galeria.obtenerPorProveedor(id_proveedor);

    res.json({
      success: true,
      data: fotos,
      total: fotos.length,
      limite_maximo: LIMITES.MAX_FOTOS_POR_PROVEEDOR
    });

  } catch (error) {
    console.error('Error en obtenerGaleriaProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener galería',
      error: error.message
    });
  }
};

// Obtener mi galería (proveedor autenticado)
const obtenerMiGaleria = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const fotos = await Galeria.obtenerPorProveedor(id_proveedor);
    const infoLimite = await Galeria.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      data: fotos,
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en obtenerMiGaleria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener galería',
      error: error.message
    });
  }
};

// Agregar foto a la galería
const agregarFoto = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { url_foto, descripcion, orden } = req.body;

    // Validar que se proporcione la URL
    if (!url_foto) {
      return res.status(400).json({
        success: false,
        message: 'La URL de la foto es obligatoria'
      });
    }

    // Validar formato de URL (básico)
    const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|webp)(\?.*)?$/i;
    if (!urlRegex.test(url_foto)) {
      return res.status(400).json({
        success: false,
        message: MENSAJES.FORMATO_INVALIDO
      });
    }

    // Intentar agregar la foto (el modelo verificará el límite)
    let nuevaFoto;
    try {
      nuevaFoto = await Galeria.crear({
        id_proveedor,
        url_foto,
        descripcion,
        orden
      });
    } catch (error) {
      if (error.message.startsWith('LIMITE_EXCEDIDO')) {
        const limite = error.message.split(':')[1];
        return res.status(400).json({
          success: false,
          message: `Has alcanzado el límite máximo de ${limite} fotos en tu galería`,
          codigo: 'LIMITE_EXCEDIDO',
          limite_maximo: parseInt(limite)
        });
      }
      throw error;
    }

    const infoLimite = await Galeria.obtenerInfoLimite(id_proveedor);

    res.status(201).json({
      success: true,
      message: 'Foto agregada exitosamente',
      data: nuevaFoto,
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en agregarFoto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar foto',
      error: error.message
    });
  }
};

// Actualizar foto
const actualizarFoto = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;
    const { descripcion, orden } = req.body;

    const fotoActualizada = await Galeria.actualizar(id, id_proveedor, {
      descripcion,
      orden
    });

    if (!fotoActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada o no tienes permiso para modificarla'
      });
    }

    res.json({
      success: true,
      message: 'Foto actualizada exitosamente',
      data: fotoActualizada
    });

  } catch (error) {
    console.error('Error en actualizarFoto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar foto',
      error: error.message
    });
  }
};

// Eliminar foto
const eliminarFoto = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id } = req.params;

    const fotoEliminada = await Galeria.eliminar(id, id_proveedor);

    if (!fotoEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Foto no encontrada o no tienes permiso para eliminarla'
      });
    }

    const infoLimite = await Galeria.obtenerInfoLimite(id_proveedor);

    res.json({
      success: true,
      message: 'Foto eliminada exitosamente',
      limite: infoLimite
    });

  } catch (error) {
    console.error('Error en eliminarFoto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar foto',
      error: error.message
    });
  }
};

// Reordenar fotos
const reordenarFotos = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { orden } = req.body;

    // Validar que se proporcione el array de orden
    if (!Array.isArray(orden) || orden.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array con el nuevo orden de las fotos'
      });
    }

    // Validar formato del array
    const formatoValido = orden.every(item => 
      item.hasOwnProperty('id_foto') && 
      item.hasOwnProperty('orden')
    );

    if (!formatoValido) {
      return res.status(400).json({
        success: false,
        message: 'Formato inválido. Cada elemento debe tener id_foto y orden'
      });
    }

    const fotosReordenadas = await Galeria.reordenar(id_proveedor, orden);

    res.json({
      success: true,
      message: 'Fotos reordenadas exitosamente',
      data: fotosReordenadas
    });

  } catch (error) {
    console.error('Error en reordenarFotos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar fotos',
      error: error.message
    });
  }
};

// Obtener información del límite
const obtenerInfoLimite = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const infoLimite = await Galeria.obtenerInfoLimite(id_proveedor);

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
  obtenerGaleriaProveedor,
  obtenerMiGaleria,
  agregarFoto,
  actualizarFoto,
  eliminarFoto,
  reordenarFotos,
  obtenerInfoLimite
};