const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  registrarProveedor,
  loginProveedor,
  obtenerPerfil,
  actualizarPerfil,
  buscarProveedores,
  obtenerProveedorPublico
} = require('../controllers/proveedorController');

// Rutas públicas
router.post('/registro', registrarProveedor);
router.post('/login', loginProveedor);
router.get('/buscar', buscarProveedores);
router.get('/publico/:id', obtenerProveedorPublico);

// Rutas protegidas
router.get('/perfil', autenticar, verificarRol('proveedor'), obtenerPerfil);
router.put('/perfil', autenticar, verificarRol('proveedor'), actualizarPerfil);

module.exports = router;