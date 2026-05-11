const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const { uploadGaleria } = require('../config/cloudinary');
const {
  obtenerGaleriaProveedor,
  obtenerMiGaleria,
  agregarFoto,
  actualizarFoto,
  eliminarFoto,
  reordenarFotos,
  obtenerInfoLimite
} = require('../controllers/galeriaController');

// ========== RUTAS PÚBLICAS ==========
// Obtener galería de un proveedor específico (para clientes)
router.get('/proveedor/:id_proveedor', obtenerGaleriaProveedor);

// ========== RUTAS PROTEGIDAS - PROVEEDORES ==========
// Obtener mi galería
router.get('/mi-galeria', autenticar, verificarRol('proveedor'), obtenerMiGaleria);

// Obtener información del límite de fotos
router.get('/limite', autenticar, verificarRol('proveedor'), obtenerInfoLimite);

// ⭐ ACTUALIZADO: Agregar foto con upload a Cloudinary
router.post(
  '/', 
  autenticar, 
  verificarRol('proveedor'), 
  uploadGaleria, // ← Middleware de Multer + Cloudinary
  agregarFoto
);

// Reordenar fotos
router.put('/reordenar', autenticar, verificarRol('proveedor'), reordenarFotos);

// Actualizar foto (descripción, orden)
router.put('/:id', autenticar, verificarRol('proveedor'), actualizarFoto);

// Eliminar foto
router.delete('/:id', autenticar, verificarRol('proveedor'), eliminarFoto);

module.exports = router;