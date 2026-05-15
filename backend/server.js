const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Inicializar Socket.IO
const { initializeSocket } = require('./config/socket');
initializeSocket(server);

// Importar configuración de base de datos
const pool = require('./config/database');


const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Ruta de prueba
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta para probar la conexión a la base de datos
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true,
      message: 'Conexión a base de datos exitosa',
      serverTime: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al conectar con la base de datos',
      error: error.message
    });
  }
});

// Importar rutas
const clienteRoutes = require('./routes/clienteRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const galeriaRoutes = require('./routes/galeriaRoutes');
const promocionRoutes = require('./routes/promocionRoutes');
const resenaRoutes = require('./routes/resenaRoutes');
const calendarioRoutes = require('./routes/calendarioRoutes'); 
const listaRoutes = require('./routes/listaRoutes');
const lugarRoutes = require('./routes/lugarRoutes');
const adminRoutes = require('./routes/adminRoutes');
const proveedorEventoRoutes = require('./routes/proveedorEventoRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const tipoEventoRoutes = require('./routes/tipoEventoRoutes');
const recomendacionRoutes = require('./routes/recomendacionRoutes');

// Usar las rutas
app.use('/api/clientes', clienteRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/galeria', galeriaRoutes);
app.use('/api/promociones', promocionRoutes);
app.use('/api/resenas', resenaRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/listas', listaRoutes);
app.use('/api/lugar', lugarRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proveedor-eventos', proveedorEventoRoutes);
app.use('/api/tipos-eventos', tipoEventoRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);


// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Ruta no encontrada',
    ruta: req.originalUrl
  });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🔌 WebSocket inicializado correctamente`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server };