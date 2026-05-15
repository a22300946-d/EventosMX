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
  // Catálogos
  obtenerCiudades,
  crearCiudad,
  eliminarCiudad,
  obtenerCategoriasAdmin,
  crearCategoriaAdmin,
  eliminarCategoriaAdmin,
  obtenerTiposEventoAdmin,
  crearTipoEventoAdmin,
  eliminarTipoEventoAdmin,
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

// Módulo catálogos — Ciudades
router.get('/catalogos/ciudades',           ...soloAdmin, obtenerCiudades);
router.post('/catalogos/ciudades',          ...soloAdmin, crearCiudad);
router.delete('/catalogos/ciudades/:id',    ...soloAdmin, eliminarCiudad);

// Módulo catálogos — Tipos de servicio (categorías)
router.get('/catalogos/categorias',         ...soloAdmin, obtenerCategoriasAdmin);
router.post('/catalogos/categorias',        ...soloAdmin, crearCategoriaAdmin);
router.delete('/catalogos/categorias/:id',  ...soloAdmin, eliminarCategoriaAdmin);

// Módulo catálogos — Tipos de evento
router.get('/catalogos/tipos-evento',        ...soloAdmin, obtenerTiposEventoAdmin);
router.post('/catalogos/tipos-evento',       ...soloAdmin, crearTipoEventoAdmin);
router.delete('/catalogos/tipos-evento/:id', ...soloAdmin, eliminarTipoEventoAdmin);

module.exports = router;