const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const { uploadLogo } = require('../config/cloudinary');
const {
  registrarCliente,
  loginCliente,
  obtenerPerfil,
  actualizarPerfil,
  actualizarFotoPerfil,
  solicitarRecuperacion
} = require('../controllers/clienteController');

// ========== RUTAS PÚBLICAS ==========
router.post('/registro', registrarCliente);
router.post('/login', loginCliente);
router.post('/recuperar-contrasena', solicitarRecuperacion);

// ========== RUTAS PROTEGIDAS - CLIENTES ==========
// Obtener mi perfil
router.get('/perfil', autenticar, verificarRol('cliente'), obtenerPerfil);

// Actualizar mi perfil (datos generales)
router.put('/perfil', autenticar, verificarRol('cliente'), actualizarPerfil);

// ⭐ NUEVO: Actualizar foto de perfil
router.put(
  '/perfil/foto',
  autenticar,
  verificarRol('cliente'),
  uploadLogo, // ← Middleware de Cloudinary
  actualizarFotoPerfil
);

module.exports = router;