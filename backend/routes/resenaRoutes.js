const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearResena,
  obtenerResenasProveedor,
  obtenerResenaPorId,
  reportarResena,
  eliminarMiResena
} = require('../controllers/resenaController');

// Rutas públicas
router.get('/proveedor/:id_proveedor', obtenerResenasProveedor);
router.get('/:id', obtenerResenaPorId);

// Rutas protegidas para clientes
router.post('/', autenticar, verificarRol('cliente'), crearResena);
router.delete('/:id', autenticar, verificarRol('cliente'), eliminarMiResena);

// Rutas protegidas (cualquier usuario autenticado)
router.put('/:id/reportar', autenticar, reportarResena);

module.exports = router;
