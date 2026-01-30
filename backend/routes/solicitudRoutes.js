const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const {
  crearSolicitud,
  obtenerMisSolicitudes,
  obtenerSolicitudesRecibidas,
  obtenerSolicitudPorId,
  responderSolicitud,
  aceptarSolicitud,
  rechazarSolicitud,
  cancelarSolicitud,
  obtenerEstadisticas
} = require('../controllers/solicitudController');

// Todas las rutas requieren autenticación
router.use(autenticar);

// Rutas para clientes
router.post('/', crearSolicitud);
router.get('/mis-solicitudes', obtenerMisSolicitudes);
router.put('/:id/aceptar', aceptarSolicitud);
router.delete('/:id/cancelar', cancelarSolicitud);

// Rutas para proveedores
router.get('/recibidas', obtenerSolicitudesRecibidas);
router.put('/:id/responder', responderSolicitud);

// Rutas compartidas
router.get('/estadisticas', obtenerEstadisticas);
router.get('/:id', obtenerSolicitudPorId);
router.put('/:id/rechazar', rechazarSolicitud);

module.exports = router;