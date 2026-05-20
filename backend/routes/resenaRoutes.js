const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearResena,
  obtenerResenasProveedor,
  obtenerResenaPorId,
  obtenerMisResenas,       // ← agregar este import
  reportarResena,
  eliminarMiResena
} = require('../controllers/resenaController');

// Rutas públicas
router.get('/proveedor/:id_proveedor', obtenerResenasProveedor);

// ✅ DEBE IR ANTES de /:id para que Express no confunda "mis-resenas" con un ID
router.get('/mis-resenas', autenticar, verificarRol('cliente'), obtenerMisResenas);

// Esta ruta dinámica va AL FINAL de los GET
router.get('/:id', obtenerResenaPorId);

// Rutas protegidas para clientes
router.post('/', autenticar, verificarRol('cliente'), crearResena);
router.delete('/:id', autenticar, verificarRol('cliente'), eliminarMiResena);

// Rutas protegidas (cualquier usuario autenticado)
router.put('/:id/reportar', autenticar, reportarResena);

module.exports = router;