const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const {
  enviarMensaje,
  obtenerMensajes,
  obtenerConversaciones,
  marcarComoLeido,
  contarNoLeidos,
  eliminarMensaje
} = require('../controllers/mensajeController');

// Todas las rutas requieren autenticación
router.use(autenticar);

// Rutas de conversaciones
router.get('/conversaciones', obtenerConversaciones);

// Rutas de mensajes por solicitud
router.post('/solicitud/:id_solicitud', enviarMensaje);
router.get('/solicitud/:id_solicitud', obtenerMensajes);
router.put('/solicitud/:id_solicitud/leer', marcarComoLeido);
router.get('/solicitud/:id_solicitud/no-leidos', contarNoLeidos);

// Eliminar mensaje
router.delete('/:id_mensaje', eliminarMensaje);

module.exports = router;