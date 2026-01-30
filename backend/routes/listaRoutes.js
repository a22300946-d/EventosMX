const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearLista,
  obtenerMisListas,
  obtenerListaPorId,
  actualizarLista,
  eliminarLista,
  agregarProveedor,
  actualizarEstadoProveedor,
  actualizarNotasProveedor,
  eliminarProveedor,
  duplicarLista
} = require('../controllers/listaController');

// Todas las rutas requieren autenticación de cliente
router.use(autenticar, verificarRol('cliente'));

// Rutas de listas
router.post('/', crearLista);
router.get('/', obtenerMisListas);
router.get('/:id', obtenerListaPorId);
router.put('/:id', actualizarLista);
router.delete('/:id', eliminarLista);
router.post('/:id/duplicar', duplicarLista);

// Rutas de proveedores en listas
router.post('/:id/proveedores', agregarProveedor);
router.put('/proveedores/:id_lista_proveedor/estado', actualizarEstadoProveedor);
router.put('/proveedores/:id_lista_proveedor/notas', actualizarNotasProveedor);
router.delete('/proveedores/:id_lista_proveedor', eliminarProveedor);

module.exports = router;