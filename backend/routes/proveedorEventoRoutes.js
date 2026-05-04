const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  obtenerTiposEventos,
  obtenerEventosDeProveedor,
  obtenerMisEventos,
  agregarEvento,
  eliminarEvento,
  actualizarMisEventos,
} = require('../controllers/proveedorEventoController');

// Rutas públicas
router.get('/tipos-eventos', obtenerTiposEventos);
router.get('/proveedor/:id_proveedor/eventos', obtenerEventosDeProveedor);

// Rutas protegidas para proveedores
router.get('/mis-eventos', autenticar, verificarRol('proveedor'), obtenerMisEventos);
router.post('/mis-eventos', autenticar, verificarRol('proveedor'), agregarEvento);
router.put('/mis-eventos', autenticar, verificarRol('proveedor'), actualizarMisEventos);
router.delete('/mis-eventos/:id_tipo_evento', autenticar, verificarRol('proveedor'), eliminarEvento);

module.exports = router;