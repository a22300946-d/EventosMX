// backend/routes/tipoEventoRoutes.js
const express = require('express');
const router = express.Router();
const { obtenerTiposEventos } = require('../controllers/tipoEventoController');

// Ruta pública para obtener tipos de eventos
router.get('/', obtenerTiposEventos);

module.exports = router;