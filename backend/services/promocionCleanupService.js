/**
 * promocionCleanupService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Elimina automáticamente (hard-delete) las promociones cuyo período haya
 * finalizado (fecha_fin < fecha actual).
 *
 * Se ejecuta:
 *   - Inmediatamente al arrancar el servidor.
 *   - Cada CLEANUP_INTERVAL_MS milisegundos (por defecto, cada hora).
 *
 * Se inicia desde server.js igual que timerService.
 */

const pool = require('../config/database');

// ── Intervalo de ejecución: cada 1 hora ─────────────────────────────────────
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// ── Lógica principal de limpieza ─────────────────────────────────────────────
async function eliminarPromocionesExpiradas() {
  const ahora = new Date().toLocaleTimeString('es-MX');
  console.log(`🧹 [PromocionCleanup] Revisando promociones expiradas... ${ahora}`);

  try {
    const resultado = await pool.query(`
      DELETE FROM Promocion
      WHERE fecha_fin < CURRENT_DATE
      RETURNING id_promocion, titulo, id_proveedor, fecha_fin
    `);

    const eliminadas = resultado.rows;

    if (eliminadas.length === 0) {
      console.log('✅ [PromocionCleanup] No hay promociones expiradas por eliminar.');
    } else {
      console.log(`🗑️  [PromocionCleanup] ${eliminadas.length} promoción(es) expirada(s) eliminada(s):`);
      eliminadas.forEach((p) => {
        console.log(
          `   → ID ${p.id_promocion} | "${p.titulo}" | Proveedor #${p.id_proveedor} | Venció: ${p.fecha_fin}`
        );
      });
    }

    return { eliminadas: eliminadas.length, detalle: eliminadas };
  } catch (error) {
    console.error('❌ [PromocionCleanup] Error al eliminar promociones expiradas:', error.message);
    return { eliminadas: 0, error: error.message };
  }
}

// ── Iniciar el servicio ───────────────────────────────────────────────────────
function iniciarPromocionCleanupService() {
  console.log(
    `⏱️  [PromocionCleanup] Iniciado. Limpieza automática cada ${CLEANUP_INTERVAL_MS / 60000} minutos.`
  );

  // Primera ejecución inmediata al arrancar
  eliminarPromocionesExpiradas();

  // Ciclo periódico
  setInterval(eliminarPromocionesExpiradas, CLEANUP_INTERVAL_MS);
}

module.exports = { iniciarPromocionCleanupService, eliminarPromocionesExpiradas };