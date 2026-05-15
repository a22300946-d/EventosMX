const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  guardarPreferencias,
  obtenerPreferencias,
  obtenerRecomendaciones,
  eliminarPreferencias
} = require('../controllers/recomendacionController');

// Todas las rutas requieren autenticación de cliente
router.use(autenticar);
router.use(verificarRol('cliente'));

// ========== PREFERENCIAS ==========
// Guardar o actualizar preferencias
router.post('/preferencias', guardarPreferencias);

// Obtener preferencias del cliente
router.get('/preferencias', obtenerPreferencias);

// Eliminar preferencias
router.delete('/preferencias', eliminarPreferencias);

// ========== RECOMENDACIONES ==========
// Obtener proveedores recomendados basados en preferencias
router.get('/', obtenerRecomendaciones);

module.exports = router;