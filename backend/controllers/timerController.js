/**
 * timerController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Controlador para que el administrador consulte y actualice la configuración
 * de los temporizadores de solicitudes.
 *
 * Rutas (se agregan en adminRoutes.js):
 *   GET  /api/admin/timer-config          → obtenerConfigTimer
 *   PUT  /api/admin/timer-config          → actualizarConfigTimer
 */

const pool = require('../config/database');
const { obtenerConfiguracion } = require('../services/timerService');

// ── Obtener configuración actual ─────────────────────────────────────────────
const obtenerConfigTimer = async (req, res) => {
  try {
    const config = await obtenerConfiguracion();
    res.json({
      success: true,
      data: {
        horas_recordatorio_proveedor: config.horas_recordatorio_proveedor,
        horas_limite_cliente: config.horas_limite_cliente,
        descripcion: {
          horas_recordatorio_proveedor:
            'Horas tras las cuales se envía un recordatorio automático al proveedor sobre la solicitud pendiente',
          horas_limite_cliente:
            'Horas tras las cuales se notifica al cliente que el proveedor no ha respondido',
        },
      },
    });
  } catch (error) {
    console.error('Error en obtenerConfigTimer:', error);
    res.status(500).json({ success: false, message: 'Error al obtener configuración', error: error.message });
  }
};

// ── Actualizar configuración ─────────────────────────────────────────────────
const actualizarConfigTimer = async (req, res) => {
  try {
    const { horas_recordatorio_proveedor, horas_limite_cliente } = req.body;

    // Validaciones
    const errores = [];

    if (horas_recordatorio_proveedor !== undefined) {
      const h = parseFloat(horas_recordatorio_proveedor);
      if (isNaN(h) || h < 1)   errores.push('horas_recordatorio_proveedor debe ser al menos 1');
      if (h > 720)              errores.push('horas_recordatorio_proveedor no puede superar 720 horas (30 días)');
    }

    if (horas_limite_cliente !== undefined) {
      const h = parseFloat(horas_limite_cliente);
      if (isNaN(h) || h < 1)   errores.push('horas_limite_cliente debe ser al menos 1');
      if (h > 720)              errores.push('horas_limite_cliente no puede superar 720 horas (30 días)');
    }

    // Validar que el segundo umbral sea mayor que el primero
    const configActual = await obtenerConfiguracion();
    const nuevoRecordatorio = horas_recordatorio_proveedor !== undefined
      ? parseFloat(horas_recordatorio_proveedor)
      : configActual.horas_recordatorio_proveedor;
    const nuevoLimite = horas_limite_cliente !== undefined
      ? parseFloat(horas_limite_cliente)
      : configActual.horas_limite_cliente;

    if (nuevoLimite <= nuevoRecordatorio) {
      errores.push('horas_limite_cliente debe ser mayor que horas_recordatorio_proveedor');
    }

    if (errores.length > 0) {
      return res.status(400).json({ success: false, message: 'Datos inválidos', errores });
    }

    // Upsert en la tabla configuracion_timer
    const actualizaciones = [];
    if (horas_recordatorio_proveedor !== undefined) {
      actualizaciones.push(['horas_recordatorio_proveedor', parseFloat(horas_recordatorio_proveedor)]);
    }
    if (horas_limite_cliente !== undefined) {
      actualizaciones.push(['horas_limite_cliente', parseFloat(horas_limite_cliente)]);
    }

    for (const [clave, valor] of actualizaciones) {
      await pool.query(`
        INSERT INTO configuracion_timer (clave, valor)
        VALUES ($1, $2)
        ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = NOW()
      `, [clave, valor.toString()]);
    }

    const configNueva = await obtenerConfiguracion();

    res.json({
      success: true,
      message: 'Configuración de temporizadores actualizada correctamente',
      data: configNueva,
    });
  } catch (error) {
    console.error('Error en actualizarConfigTimer:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar configuración', error: error.message });
  }
};

module.exports = { obtenerConfigTimer, actualizarConfigTimer };
