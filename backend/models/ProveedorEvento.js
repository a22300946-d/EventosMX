const pool = require('../config/database');

class ProveedorEvento {
  // Obtener todos los tipos de eventos disponibles
  static async obtenerTiposEventos() {
    const query = `
      SELECT * FROM TipoEvento 
      WHERE activo = true 
      ORDER BY nombre_evento ASC
    `;
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Obtener eventos de un proveedor
  static async obtenerEventosDeProveedor(id_proveedor) {
    const query = `
      SELECT 
        pe.id_proveedor_evento,
        pe.id_tipo_evento,
        te.nombre_evento,
        te.descripcion,
        te.icono,
        pe.fecha_agregado
      FROM ProveedorEvento pe
      INNER JOIN TipoEvento te ON pe.id_tipo_evento = te.id_tipo_evento
      WHERE pe.id_proveedor = $1
      ORDER BY te.nombre_evento ASC
    `;
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows;
  }

  // Agregar evento a un proveedor
  static async agregarEventoAProveedor(id_proveedor, id_tipo_evento) {
    const query = `
      INSERT INTO ProveedorEvento (id_proveedor, id_tipo_evento)
      VALUES ($1, $2)
      RETURNING *
    `;
    
    try {
      const resultado = await pool.query(query, [id_proveedor, id_tipo_evento]);
      return resultado.rows[0];
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('Este tipo de evento ya está agregado');
      }
      throw error;
    }
  }

  // Eliminar evento de un proveedor
  static async eliminarEventoDeProveedor(id_proveedor, id_tipo_evento) {
    const query = `
      DELETE FROM ProveedorEvento
      WHERE id_proveedor = $1 AND id_tipo_evento = $2
      RETURNING *
    `;
    const resultado = await pool.query(query, [id_proveedor, id_tipo_evento]);
    return resultado.rows[0];
  }

  // Actualizar todos los eventos de un proveedor (reemplazar)
  static async actualizarEventosDeProveedor(id_proveedor, ids_tipos_eventos) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Eliminar todos los eventos actuales
      await client.query('DELETE FROM ProveedorEvento WHERE id_proveedor = $1', [id_proveedor]);

      // Insertar los nuevos eventos
      if (ids_tipos_eventos && ids_tipos_eventos.length > 0) {
        const values = ids_tipos_eventos.map((id_tipo) => 
          `(${id_proveedor}, ${id_tipo})`
        ).join(',');

        await client.query(`
          INSERT INTO ProveedorEvento (id_proveedor, id_tipo_evento)
          VALUES ${values}
        `);
      }

      await client.query('COMMIT');

      // Retornar los eventos actualizados
      return await this.obtenerEventosDeProveedor(id_proveedor);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar proveedores por tipo de evento
  static async buscarProveedoresPorEvento(id_tipo_evento) {
    const query = `
      SELECT 
        p.id_proveedor,
        p.nombre_negocio,
        p.tipo_servicio,
        p.ciudad,
        p.calificacion_promedio,
        p.logo
      FROM Proveedor p
      INNER JOIN ProveedorEvento pe ON p.id_proveedor = pe.id_proveedor
      WHERE pe.id_tipo_evento = $1
      ORDER BY p.calificacion_promedio DESC
    `;
    const resultado = await pool.query(query, [id_tipo_evento]);
    return resultado.rows;
  }
}

module.exports = ProveedorEvento;