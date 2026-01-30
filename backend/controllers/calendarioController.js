const Calendario = require('../models/Calendario');

// Obtener mi calendario (proveedor)
const obtenerMiCalendario = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fecha_inicio, fecha_fin, disponible } = req.query;

    const calendario = await Calendario.obtenerPorProveedor(id_proveedor, {
      fecha_inicio,
      fecha_fin,
      disponible: disponible !== undefined ? disponible === 'true' : undefined
    });

    res.json({
      success: true,
      data: calendario,
      total: calendario.length
    });

  } catch (error) {
    console.error('Error en obtenerMiCalendario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener calendario',
      error: error.message
    });
  }
};

// Verificar disponibilidad de una fecha
const verificarDisponibilidad = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fecha } = req.params;

    // Validar formato de fecha
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }

    const disponible = await Calendario.estaDisponible(id_proveedor, fecha);
    const detalle = await Calendario.obtenerPorFecha(id_proveedor, fecha);

    res.json({
      success: true,
      data: {
        fecha,
        disponible,
        detalle: detalle || null
      }
    });

  } catch (error) {
    console.error('Error en verificarDisponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar disponibilidad',
      error: error.message
    });
  }
};

// Marcar fecha como no disponible
const bloquearFecha = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fecha } = req.params;
    const { motivo } = req.body;

    // Validar que la fecha no sea pasada
    const fechaObj = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaObj < hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden bloquear fechas pasadas'
      });
    }

    const fechaActualizada = await Calendario.marcarNoDisponible(
      id_proveedor,
      fecha,
      motivo
    );

    res.json({
      success: true,
      message: 'Fecha bloqueada exitosamente',
      data: fechaActualizada
    });

  } catch (error) {
    console.error('Error en bloquearFecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al bloquear fecha',
      error: error.message
    });
  }
};

// Liberar fecha (marcar como disponible)
const liberarFecha = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fecha } = req.params;

    const fechaActualizada = await Calendario.marcarDisponible(id_proveedor, fecha);

    res.json({
      success: true,
      message: 'Fecha liberada exitosamente',
      data: fechaActualizada
    });

  } catch (error) {
    console.error('Error en liberarFecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al liberar fecha',
      error: error.message
    });
  }
};

// Bloquear múltiples fechas
const bloquearMultiplesFechas = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fechas, motivo } = req.body;

    // Validar que se proporcione el array de fechas
    if (!Array.isArray(fechas) || fechas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de fechas'
      });
    }

    // Validar que ninguna fecha sea pasada
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (const fecha of fechas) {
      const fechaObj = new Date(fecha);
      if (fechaObj < hoy) {
        return res.status(400).json({
          success: false,
          message: `La fecha ${fecha} es una fecha pasada y no se puede bloquear`
        });
      }
    }

    const fechasActualizadas = await Calendario.bloquearMultiplesFechas(
      id_proveedor,
      fechas,
      motivo
    );

    res.json({
      success: true,
      message: `${fechasActualizadas.length} fechas bloqueadas exitosamente`,
      data: fechasActualizadas
    });

  } catch (error) {
    console.error('Error en bloquearMultiplesFechas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al bloquear fechas',
      error: error.message
    });
  }
};

// Liberar múltiples fechas
const liberarMultiplesFechas = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fechas } = req.body;

    if (!Array.isArray(fechas) || fechas.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de fechas'
      });
    }

    const fechasActualizadas = await Calendario.liberarMultiplesFechas(
      id_proveedor,
      fechas
    );

    res.json({
      success: true,
      message: `${fechasActualizadas.length} fechas liberadas exitosamente`,
      data: fechasActualizadas
    });

  } catch (error) {
    console.error('Error en liberarMultiplesFechas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al liberar fechas',
      error: error.message
    });
  }
};

// Obtener disponibilidad pública de un proveedor
const obtenerDisponibilidadPublica = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    // Validar fechas
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar fecha_inicio y fecha_fin'
      });
    }

    const disponibilidad = await Calendario.obtenerDisponibilidadPublica(
      id_proveedor,
      fecha_inicio,
      fecha_fin
    );

    res.json({
      success: true,
      data: disponibilidad,
      total: disponibilidad.length
    });

  } catch (error) {
    console.error('Error en obtenerDisponibilidadPublica:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener disponibilidad',
      error: error.message
    });
  }
};

// Obtener estadísticas del calendario
const obtenerEstadisticas = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { mes, anio } = req.query;

    const estadisticas = await Calendario.obtenerEstadisticas(
      id_proveedor,
      mes ? parseInt(mes) : null,
      anio ? parseInt(anio) : null
    );

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

// Eliminar fecha del calendario
const eliminarFecha = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { fecha } = req.params;

    const fechaEliminada = await Calendario.eliminar(id_proveedor, fecha);

    if (!fechaEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Fecha no encontrada o está asociada a una solicitud y no se puede eliminar'
      });
    }

    res.json({
      success: true,
      message: 'Fecha eliminada del calendario'
    });

  } catch (error) {
    console.error('Error en eliminarFecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar fecha',
      error: error.message
    });
  }
};

module.exports = {
  obtenerMiCalendario,
  verificarDisponibilidad,
  bloquearFecha,
  liberarFecha,
  bloquearMultiplesFechas,
  liberarMultiplesFechas,
  obtenerDisponibilidadPublica,
  obtenerEstadisticas,
  eliminarFecha
};