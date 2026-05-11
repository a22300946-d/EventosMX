const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const { uploadLogo } = require('../config/cloudinary');
const {
  registrarProveedor,
  loginProveedor,
  obtenerPerfil,
  actualizarPerfil,
  actualizarFotoPerfil,
  buscarProveedores,
  obtenerProveedorPublico
} = require('../controllers/proveedorController');

// ========== RUTAS PÚBLICAS ==========
router.post('/registro', registrarProveedor);
router.post('/login', loginProveedor);
router.get('/buscar', buscarProveedores);
router.get('/publico/:id', obtenerProveedorPublico);

// ========== RUTAS PROTEGIDAS - PROVEEDORES ==========
// Obtener mi perfil
router.get('/perfil', autenticar, verificarRol('proveedor'), obtenerPerfil);

// Actualizar mi perfil (datos generales)
router.put('/perfil', autenticar, verificarRol('proveedor'), actualizarPerfil);

// ⭐ NUEVO: Actualizar foto de perfil
router.put(
  '/perfil/foto',
  autenticar,
  verificarRol('proveedor'),
  uploadLogo, // ← Middleware de Cloudinary
  actualizarFotoPerfil
);

module.exports = router;