const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  min: 0,                          // No mantener conexiones mínimas
  idleTimeoutMillis: 10000,        // Cerrar idle antes de que Neon lo haga (~60s)
  connectionTimeoutMillis: 10000,  // Más tiempo para que Neon despierte
  allowExitOnIdle: true,
});

pool.on('connect', () => {
  console.log('✅ Conectado a la base de datos PostgreSQL');
});

pool.on('error', (err) => {
  // Ignorar errores de conexiones terminadas por el servidor (comportamiento normal en Neon)
  if (err.code === '57P01') return;
  console.error('❌ Error en la conexión a PostgreSQL:', err);
});

module.exports = pool;