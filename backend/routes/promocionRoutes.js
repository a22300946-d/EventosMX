const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearPromocion,
  obtenerMisPromociones,
  obtenerPromocionesProveedor,
  buscarPromociones,
  obtenerPromocionPorId,
  actualizarPromocion,
  desactivarPromocion,
  eliminarPromocion,
  obtenerInfoLimite
} = require('../controllers/promocionController');

// Rutas públicas
router.get('/buscar', buscarPromociones);
router.get('/proveedor/:id_proveedor', obtenerPromocionesProveedor);
router.get('/:id', obtenerPromocionPorId);

// Rutas protegidas para proveedores
router.post('/', autenticar, verificarRol('proveedor'), crearPromocion);
router.get('/mis-promociones/lista', autenticar, verificarRol('proveedor'), obtenerMisPromociones);
router.get('/limite/info', autenticar, verificarRol('proveedor'), obtenerInfoLimite);
router.put('/:id', autenticar, verificarRol('proveedor'), actualizarPromocion);
router.put('/:id/desactivar', autenticar, verificarRol('proveedor'), desactivarPromocion);
router.delete('/:id', autenticar, verificarRol('proveedor'), eliminarPromocion);

module.exports = router;

