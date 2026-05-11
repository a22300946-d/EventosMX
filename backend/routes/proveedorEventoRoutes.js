const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  obtenerTiposEventos,
  obtenerEventosDeProveedor,
  obtenerMisEventos,
  agregarEvento,
  eliminarEvento,
  actualizarMisEventos,
  obtenerProveedoresPorTipoEvento,
} = require('../controllers/proveedorEventoController');

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Buscar proveedores por tipo de evento (DEBE IR PRIMERO)
router.get('/por-tipo', obtenerProveedoresPorTipoEvento);

// Obtener tipos de eventos disponibles
router.get('/tipos-eventos', obtenerTiposEventos);

// Obtener eventos de un proveedor específico
router.get('/proveedor/:id_proveedor/eventos', obtenerEventosDeProveedor);

// ============================================
// RUTAS PROTEGIDAS PARA PROVEEDORES
// ============================================

router.get('/mis-eventos', autenticar, verificarRol('proveedor'), obtenerMisEventos);
router.post('/mis-eventos', autenticar, verificarRol('proveedor'), agregarEvento);
router.put('/mis-eventos', autenticar, verificarRol('proveedor'), actualizarMisEventos);
router.delete('/mis-eventos/:id_tipo_evento', autenticar, verificarRol('proveedor'), eliminarEvento);

module.exports = router;