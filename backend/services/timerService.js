/**
 * timerService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gestiona los temporizadores configurables por el administrador para
 * solicitudes pendientes. Dos umbrales:
 *
 *   1. PRIMER UMBRAL  → recordatorio automático al PROVEEDOR
 *   2. SEGUNDO UMBRAL → notificación al CLIENTE de falta de respuesta
 *
 * La configuración vive en la tabla `configuracion_timer` de la BD, lo que
 * permite al admin cambiarla sin reiniciar el servidor.
 *
 * Este servicio se inicia desde server.js y corre cada CHECK_INTERVAL ms.
 */

const pool = require('../config/database');
const emailService = require('./emailService');

// ── Intervalo de verificación (cada 15 minutos) ──────────────────────────────
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

// ── Valores por defecto si la BD no tiene configuración ─────────────────────
const DEFAULTS = {
  horas_recordatorio_proveedor: 24, // primer umbral
  horas_limite_cliente: 48,         // segundo umbral
};

// ── Leer configuración actual desde la BD ────────────────────────────────────
async function obtenerConfiguracion() {
  try {
    const result = await pool.query(
      `SELECT clave, valor FROM configuracion_timer`
    );

    const config = { ...DEFAULTS };
    for (const row of result.rows) {
      config[row.clave] = parseFloat(row.valor);
    }
    return config;
  } catch (error) {
    console.warn('⚠️  No se pudo leer configuracion_timer, usando defaults:', error.message);
    return { ...DEFAULTS };
  }
}

// ── Formatear fecha para correos ─────────────────────────────────────────────
function formatearFecha(fechaString) {
  if (!fechaString) return 'Fecha no especificada';
  const fecha = new Date(fechaString);
  const y = fecha.getUTCFullYear();
  const m = fecha.getUTCMonth();
  const d = fecha.getUTCDate();
  return new Date(y, m, d).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ── Ciclo principal ───────────────────────────────────────────────────────────
async function verificarSolicitudesPendientes() {
  console.log(`🕐 [TimerService] Verificando solicitudes pendientes... ${new Date().toLocaleTimeString('es-MX')}`);

  try {
    const config = await obtenerConfiguracion();
    const { horas_recordatorio_proveedor, horas_limite_cliente } = config;

    // Todas las solicitudes Pendientes con datos de cliente y proveedor
    const { rows: solicitudes } = await pool.query(`
      SELECT
        s.id_solicitud,
        s.fecha_envio,
        s.tipo_evento,
        s.fecha_evento,
        s.presupuesto_estimado,
        s.recordatorio_proveedor_enviado,
        s.notificacion_cliente_enviada,
        c.nombre_completo AS cliente_nombre,
        c.correo          AS cliente_correo,
        p.nombre_negocio  AS proveedor_nombre,
        p.correo          AS proveedor_correo
      FROM Solicitud s
      INNER JOIN Cliente   c ON s.id_cliente   = c.id_cliente
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.estado = 'Pendiente'
    `);

    const ahora = new Date();

    for (const sol of solicitudes) {
      const horasTranscurridas =
        (ahora - new Date(sol.fecha_envio)) / (1000 * 60 * 60);

      // ── PRIMER UMBRAL: recordatorio al proveedor ─────────────────────────
      if (
        horasTranscurridas >= horas_recordatorio_proveedor &&
        !sol.recordatorio_proveedor_enviado
      ) {
        try {
          await emailService.enviarRecordatorioProveedor({
            proveedor: { correo: sol.proveedor_correo, nombre_negocio: sol.proveedor_nombre },
            cliente:   { nombre_completo: sol.cliente_nombre },
            solicitud: {
              id:           sol.id_solicitud,
              tipo_evento:  sol.tipo_evento,
              fecha_evento: formatearFecha(sol.fecha_evento),
              horas_espera: Math.floor(horasTranscurridas),
            },
          });

          await pool.query(
            `UPDATE Solicitud SET recordatorio_proveedor_enviado = true WHERE id_solicitud = $1`,
            [sol.id_solicitud]
          );

          console.log(`📧 [TimerService] Recordatorio enviado al proveedor para solicitud #${sol.id_solicitud}`);
        } catch (err) {
          console.error(`❌ [TimerService] Error enviando recordatorio proveedor #${sol.id_solicitud}:`, err.message);
        }
      }

      // ── SEGUNDO UMBRAL: notificación al cliente ──────────────────────────
      if (
        horasTranscurridas >= horas_limite_cliente &&
        !sol.notificacion_cliente_enviada
      ) {
        try {
          await emailService.enviarNotificacionSinRespuesta({
            cliente:   { correo: sol.cliente_correo, nombre_completo: sol.cliente_nombre },
            proveedor: { nombre_negocio: sol.proveedor_nombre },
            solicitud: {
              id:           sol.id_solicitud,
              tipo_evento:  sol.tipo_evento,
              fecha_evento: formatearFecha(sol.fecha_evento),
              horas_espera: Math.floor(horasTranscurridas),
            },
          });

          await pool.query(
            `UPDATE Solicitud SET notificacion_cliente_enviada = true WHERE id_solicitud = $1`,
            [sol.id_solicitud]
          );

          console.log(`📧 [TimerService] Notificación sin-respuesta enviada al cliente para solicitud #${sol.id_solicitud}`);
        } catch (err) {
          console.error(`❌ [TimerService] Error enviando notificación cliente #${sol.id_solicitud}:`, err.message);
        }
      }
    }

    console.log(`✅ [TimerService] Revisión completada. ${solicitudes.length} solicitudes pendientes procesadas.`);
  } catch (error) {
    console.error('❌ [TimerService] Error en verificarSolicitudesPendientes:', error.message);
  }
}

// ── Iniciar el servicio ───────────────────────────────────────────────────────
function iniciarTimerService() {
  console.log(`⏱️  [TimerService] Iniciado. Revisión cada ${CHECK_INTERVAL_MS / 60000} minutos.`);

  // Primera ejecución inmediata al arrancar
  verificarSolicitudesPendientes();

  // Ciclo periódico
  setInterval(verificarSolicitudesPendientes, CHECK_INTERVAL_MS);
}

module.exports = { iniciarTimerService, obtenerConfiguracion };
