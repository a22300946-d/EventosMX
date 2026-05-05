const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const {
  obtenerMensajes,
  enviarMensaje,
  marcarComoLeidos,
  obtenerConversaciones,
  contarNoLeidos
} = require('../controllers/mensajeController');

// Todas las rutas requieren autenticación
router.use(autenticar);

// Obtener conversaciones activas del usuario
router.get('/conversaciones', obtenerConversaciones);

// Contar mensajes no leídos
router.get('/no-leidos', contarNoLeidos);

// Obtener mensajes de una solicitud específica
router.get('/solicitud/:id_solicitud', obtenerMensajes);

// Enviar un nuevo mensaje
router.post('/solicitud/:id_solicitud', enviarMensaje);

// Marcar mensajes como leídos
router.put('/solicitud/:id_solicitud/leidos', marcarComoLeidos);

module.exports = router;