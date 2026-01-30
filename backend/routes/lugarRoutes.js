const express = require('express');
const router = express.Router();
const { obtenerLugares } = require('../controllers/lugarController');

router.get('/', obtenerLugares);

module.exports = router;
