const pool = require('../config/database');
const { LIMITES } = require('../config/constantes');

class Galeria {
  
  // Obtener todas las fotos de un proveedor
  static async obtenerPorProveedor(id_proveedor) {
    const query = `
      SELECT *
      FROM Galeria
      WHERE id_proveedor = $1
      ORDER BY orden ASC, fecha_subida DESC
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows;
  }

  // Contar fotos de un proveedor
  static async contarFotos(id_proveedor) {
    const query = `
      SELECT COUNT(*) as total
      FROM Galeria
      WHERE id_proveedor = $1
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return parseInt(resultado.rows[0].total);
  }

  // Verificar si el proveedor puede agregar más fotos
  static async puedeAgregarFoto(id_proveedor) {
    const totalFotos = await this.contarFotos(id_proveedor);
    return totalFotos < LIMITES.MAX_FOTOS_POR_PROVEEDOR;
  }

  // Agregar una foto
  static async crear(datos) {
    const { id_proveedor, url_foto, descripcion, orden } = datos;
    
    // Verificar límite
    const puedeAgregar = await this.puedeAgregarFoto(id_proveedor);
    if (!puedeAgregar) {
      throw new Error(`LIMITE_EXCEDIDO:${LIMITES.MAX_FOTOS_POR_PROVEEDOR}`);
    }
    
    const query = `
      INSERT INTO Galeria (id_proveedor, url_foto, descripcion, orden)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const valores = [id_proveedor, url_foto, descripcion, orden || 0];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Obtener una foto por ID
  static async obtenerPorId(id_foto) {
    const query = 'SELECT * FROM Galeria WHERE id_foto = $1';
    const resultado = await pool.query(query, [id_foto]);
    return resultado.rows[0];
  }

  // Actualizar descripción y orden de una foto
  static async actualizar(id_foto, id_proveedor, datos) {
    const { descripcion, orden } = datos;
    
    const query = `
      UPDATE Galeria 
      SET descripcion = COALESCE($1, descripcion),
          orden = COALESCE($2, orden)
      WHERE id_foto = $3 AND id_proveedor = $4
      RETURNING *
    `;
    
    const valores = [descripcion, orden, id_foto, id_proveedor];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Eliminar una foto
  static async eliminar(id_foto, id_proveedor) {
    const query = `
      DELETE FROM Galeria 
      WHERE id_foto = $1 AND id_proveedor = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_foto, id_proveedor]);
    return resultado.rows[0];
  }

  // Reordenar fotos
  static async reordenar(id_proveedor, ordenFotos) {
    // ordenFotos es un array de objetos: [{id_foto: 1, orden: 0}, {id_foto: 2, orden: 1}, ...]
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const item of ordenFotos) {
        await client.query(
          'UPDATE Galeria SET orden = $1 WHERE id_foto = $2 AND id_proveedor = $3',
          [item.orden, item.id_foto, id_proveedor]
        );
      }
      
      await client.query('COMMIT');
      
      // Retornar fotos ordenadas
      const resultado = await client.query(
        'SELECT * FROM Galeria WHERE id_proveedor = $1 ORDER BY orden ASC',
        [id_proveedor]
      );
      
      return resultado.rows;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Obtener información de límite para un proveedor
  static async obtenerInfoLimite(id_proveedor) {
    const totalFotos = await this.contarFotos(id_proveedor);
    
    return {
      total_fotos: totalFotos,
      limite_maximo: LIMITES.MAX_FOTOS_POR_PROVEEDOR,
      fotos_disponibles: LIMITES.MAX_FOTOS_POR_PROVEEDOR - totalFotos,
      puede_agregar: totalFotos < LIMITES.MAX_FOTOS_POR_PROVEEDOR
    };
  }
}

module.exports = Galeria;