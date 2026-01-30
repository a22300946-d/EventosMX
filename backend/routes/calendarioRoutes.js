const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  obtenerMiCalendario,
  verificarDisponibilidad,
  bloquearFecha,
  liberarFecha,
  bloquearMultiplesFechas,
  liberarMultiplesFechas,
  obtenerDisponibilidadPublica,
  obtenerEstadisticas,
  eliminarFecha
} = require('../controllers/calendarioController');

// Rutas públicas
router.get('/proveedor/:id_proveedor/disponibilidad', obtenerDisponibilidadPublica);

// Rutas protegidas para proveedores
router.get('/mi-calendario', autenticar, verificarRol('proveedor'), obtenerMiCalendario);
router.get('/estadisticas', autenticar, verificarRol('proveedor'), obtenerEstadisticas);
router.get('/fecha/:fecha', autenticar, verificarRol('proveedor'), verificarDisponibilidad);
router.post('/bloquear/:fecha', autenticar, verificarRol('proveedor'), bloquearFecha);
router.post('/liberar/:fecha', autenticar, verificarRol('proveedor'), liberarFecha);
router.post('/bloquear-multiples', autenticar, verificarRol('proveedor'), bloquearMultiplesFechas);
router.post('/liberar-multiples', autenticar, verificarRol('proveedor'), liberarMultiplesFechas);
router.delete('/fecha/:fecha', autenticar, verificarRol('proveedor'), eliminarFecha);

module.exports = router;