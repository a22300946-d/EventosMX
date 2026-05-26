const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Límites del pool para evitar agotamiento de conexiones bajo carga
  max: 20,                // máximo de conexiones simultáneas (ajusta según tu plan de BD)
  min: 2,                 // conexiones mínimas siempre activas (warm-up)
  idleTimeoutMillis: 30000,     // cerrar conexiones inactivas después de 30s
  connectionTimeoutMillis: 5000, // error si no hay conexión disponible en 5s
  allowExitOnIdle: false  // mantener el proceso vivo
});

// Probar la conexión al iniciar
pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión a PostgreSQL:', err);
  process.exit(-1);
});

module.exports = pool;