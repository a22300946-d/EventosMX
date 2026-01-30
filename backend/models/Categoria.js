const pool = require('../config/database');

class Categoria {
  
  // Obtener todas las categorías activas
  static async obtenerTodas() {
    const query = `
      SELECT id_categoria, nombre_categoria, descripcion, icono
      FROM Categoria
      WHERE activo = true
      ORDER BY nombre_categoria ASC
    `;
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Buscar categoría por ID
  static async buscarPorId(id_categoria) {
    const query = 'SELECT * FROM Categoria WHERE id_categoria = $1';
    const resultado = await pool.query(query, [id_categoria]);
    return resultado.rows[0];
  }

  // Crear nueva categoría (solo admin)
  static async crear(datos) {
    const { nombre_categoria, descripcion, icono } = datos;
    
    const query = `
      INSERT INTO Categoria (nombre_categoria, descripcion, icono)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const valores = [nombre_categoria, descripcion, icono];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }
}

module.exports = Categoria;