const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  loginAdmin,
  obtenerPerfil,
  obtenerClientes,
  cambiarEstadoCliente,
  obtenerProveedores,
  cambiarEstadoProveedor,
  obtenerSolicitudesPendientes,
  resolverSolicitudProveedor,
  obtenerResenasNoPositivas,
  eliminarResena,
} = require('../controllers/adminController');

const soloAdmin = [autenticar, verificarRol('admin')];

// Autenticación
router.post('/login', loginAdmin);
router.get('/perfil', ...soloAdmin, obtenerPerfil);

// Módulo clientes
router.get('/clientes', ...soloAdmin, obtenerClientes);
router.patch('/clientes/:id/estado', ...soloAdmin, cambiarEstadoCliente);

// Módulo proveedores
router.get('/proveedores', ...soloAdmin, obtenerProveedores);
router.patch('/proveedores/:id/estado', ...soloAdmin, cambiarEstadoProveedor);

// Módulo solicitudes de proveedores
router.get('/solicitudes-proveedores', ...soloAdmin, obtenerSolicitudesPendientes);
router.patch('/solicitudes-proveedores/:id/decision', ...soloAdmin, resolverSolicitudProveedor);

// Módulo moderar reseñas
router.get('/resenas', ...soloAdmin, obtenerResenasNoPositivas);
router.delete('/resenas/:id', ...soloAdmin, eliminarResena);

module.exports = router;