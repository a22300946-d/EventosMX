const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  obtenerGaleriaProveedor,
  obtenerMiGaleria,
  agregarFoto,
  actualizarFoto,
  eliminarFoto,
  reordenarFotos,
  obtenerInfoLimite
} = require('../controllers/galeriaController');

// Rutas públicas
router.get('/proveedor/:id_proveedor', obtenerGaleriaProveedor);

// Rutas protegidas para proveedores
router.get('/mi-galeria', autenticar, verificarRol('proveedor'), obtenerMiGaleria);
router.get('/limite', autenticar, verificarRol('proveedor'), obtenerInfoLimite);
router.post('/', autenticar, verificarRol('proveedor'), agregarFoto);
router.put('/reordenar', autenticar, verificarRol('proveedor'), reordenarFotos);
router.put('/:id', autenticar, verificarRol('proveedor'), actualizarFoto);
router.delete('/:id', autenticar, verificarRol('proveedor'), eliminarFoto);

module.exports = router;
