const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearServicio,
  obtenerMisServicios,
  obtenerServicioPorId,
  buscarServicios,
  actualizarServicio,
  eliminarServicio,
  obtenerServiciosPorCategoria
} = require('../controllers/servicioController');

// Rutas públicas
router.get('/buscar', buscarServicios);
router.get('/categoria/:id_categoria', obtenerServiciosPorCategoria);
router.get('/:id', obtenerServicioPorId);

// Rutas protegidas para proveedores
router.post('/', autenticar, verificarRol('proveedor'), crearServicio);
router.get('/mis-servicios/lista', autenticar, verificarRol('proveedor'), obtenerMisServicios);
router.put('/:id', autenticar, verificarRol('proveedor'), actualizarServicio);
router.delete('/:id', autenticar, verificarRol('proveedor'), eliminarServicio);

module.exports = router;
