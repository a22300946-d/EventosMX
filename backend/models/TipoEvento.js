// backend/models/TipoEvento.js
const pool = require('../config/database');

class TipoEvento {
  static async obtenerTodos() {
    const query = `
      SELECT 
        id_tipo_evento,
        nombre_evento,
        icono,
        descripcion
      FROM TipoEvento
      ORDER BY nombre_evento ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = TipoEvento;