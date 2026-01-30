const express = require('express');
const router = express.Router();
const {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria
} = require('../controllers/categoriaController');

// Rutas públicas
router.get('/', obtenerCategorias);
router.get('/:id', obtenerCategoriaPorId);

// Rutas protegidas (solo admin - lo implementaremos después)
router.post('/', crearCategoria);

module.exports = router;