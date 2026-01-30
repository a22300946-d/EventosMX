const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  registrarCliente,
  loginCliente,
  obtenerPerfil,
  actualizarPerfil
} = require('../controllers/clienteController');

// Rutas públicas
router.post('/registro', registrarCliente);
router.post('/login', loginCliente);

// Rutas protegidas (requieren autenticación)
router.get('/perfil', autenticar, verificarRol('cliente'), obtenerPerfil);
router.put('/perfil', autenticar, verificarRol('cliente'), actualizarPerfil);

module.exports = router;