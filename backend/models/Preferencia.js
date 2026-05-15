const pool = require('../config/database');

class Preferencia {
  
  // Crear o actualizar preferencias del cliente
  static async guardarPreferencias(id_cliente, datos) {
    const {
      tipos_eventos,
      servicios_preferidos,
      ubicacion_preferida,
      precio_min,
      precio_max
    } = datos;

    // Verificar si ya existen preferencias
    const existente = await this.obtenerPorCliente(id_cliente);

    if (existente) {
      // Actualizar
      const query = `
        UPDATE preferencias_cliente
        SET tipos_eventos = $1,
            servicios_preferidos = $2,
            ubicacion_preferida = $3,
            precio_min = $4,
            precio_max = $5,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_cliente = $6
        RETURNING *
      `;
      
      const valores = [
        tipos_eventos,
        servicios_preferidos,
        ubicacion_preferida,
        precio_min || null,
        precio_max || null,
        id_cliente
      ];

      const resultado = await pool.query(query, valores);
      return resultado.rows[0];
    } else {
      // Crear
      const query = `
        INSERT INTO preferencias_cliente 
        (id_cliente, tipos_eventos, servicios_preferidos, ubicacion_preferida, precio_min, precio_max)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const valores = [
        id_cliente,
        tipos_eventos,
        servicios_preferidos,
        ubicacion_preferida,
        precio_min || null,
        precio_max || null
      ];

      const resultado = await pool.query(query, valores);
      return resultado.rows[0];
    }
  }

  // Obtener preferencias de un cliente
  static async obtenerPorCliente(id_cliente) {
    const query = `
      SELECT * FROM preferencias_cliente 
      WHERE id_cliente = $1
    `;
    
    const resultado = await pool.query(query, [id_cliente]);
    return resultado.rows[0];
  }

  // Eliminar preferencias
  static async eliminar(id_cliente) {
    const query = 'DELETE FROM preferencias_cliente WHERE id_cliente = $1';
    await pool.query(query, [id_cliente]);
  }
}

module.exports = Preferencia;