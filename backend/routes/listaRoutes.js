const express = require('express');
const router = express.Router();
const { autenticar, verificarRol } = require('../middleware/auth');
const {
  crearLista,
  obtenerMisListas,
  obtenerListaPorId,
  actualizarLista,
  eliminarLista,
  agregarProveedorALista,        
  cambiarEstadoProveedor,        
  eliminarProveedorDeLista,      
  obtenerListaFavoritos,
  agregarProveedorAFavoritos,
  eliminarProveedorDeFavoritos,
  verificarProveedorEnFavoritos
} = require('../controllers/listaController');

// Todas las rutas requieren autenticación de cliente
router.use(autenticar, verificarRol('cliente'));

// ========== RUTAS ESPECIALES PARA FAVORITOS (DEBEN IR PRIMERO) ==========
router.get('/favoritos', obtenerListaFavoritos);
router.post('/favoritos/proveedores', agregarProveedorAFavoritos);
router.delete('/favoritos/proveedores/:id', eliminarProveedorDeFavoritos);
router.get('/favoritos/verificar/:id_proveedor', verificarProveedorEnFavoritos);

// ========== RUTAS DE LISTAS NORMALES ==========
router.post('/', crearLista);
router.get('/', obtenerMisListas);
router.get('/:id', obtenerListaPorId);
router.put('/:id', actualizarLista);
router.delete('/:id', eliminarLista);

// ========== RUTAS DE PROVEEDORES EN LISTAS ==========
router.post('/:id/proveedores', agregarProveedorALista);              
router.put('/proveedores/:id/estado', cambiarEstadoProveedor);        
router.delete('/proveedores/:id', eliminarProveedorDeLista);          

module.exports = router;