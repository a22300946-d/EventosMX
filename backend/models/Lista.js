const pool = require('../config/database');

class Lista {
  
  // Crear una nueva lista
  static async crear(datos) {
    const { id_cliente, nombre_lista, descripcion } = datos;
    
    const query = `
      INSERT INTO Lista (id_cliente, nombre_lista, descripcion)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const valores = [id_cliente, nombre_lista, descripcion];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Obtener listas de un cliente
  static async obtenerPorCliente(id_cliente) {
    const query = `
      SELECT l.*,
             COUNT(lp.id_lista_proveedor) as total_proveedores,
             COUNT(CASE WHEN lp.estado = 'Adquirido' THEN 1 END) as proveedores_adquiridos,
             COUNT(CASE WHEN lp.estado = 'Pendiente' THEN 1 END) as proveedores_pendientes
      FROM Lista l
      LEFT JOIN ListaProveedor lp ON l.id_lista = lp.id_lista
      WHERE l.id_cliente = $1
      GROUP BY l.id_lista
      ORDER BY l.fecha_creacion DESC
    `;
    
    const resultado = await pool.query(query, [id_cliente]);
    return resultado.rows;
  }

  // Obtener una lista por ID
  static async obtenerPorId(id_lista, id_cliente) {
    const query = `
      SELECT *
      FROM Lista
      WHERE id_lista = $1 AND id_cliente = $2
    `;
    
    const resultado = await pool.query(query, [id_lista, id_cliente]);
    return resultado.rows[0];
  }

  // Actualizar lista
  static async actualizar(id_lista, id_cliente, datos) {
    const { nombre_lista, descripcion } = datos;
    
    const query = `
      UPDATE Lista 
      SET nombre_lista = COALESCE($1, nombre_lista),
          descripcion = COALESCE($2, descripcion),
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_lista = $3 AND id_cliente = $4
      RETURNING *
    `;
    
    const valores = [nombre_lista, descripcion, id_lista, id_cliente];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Eliminar lista
  static async eliminar(id_lista, id_cliente) {
    const query = `
      DELETE FROM Lista 
      WHERE id_lista = $1 AND id_cliente = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_lista, id_cliente]);
    return resultado.rows[0];
  }

  // Agregar proveedor a la lista
  static async agregarProveedor(id_lista, id_proveedor, id_cliente, notas = null) {
    // Verificar que la lista pertenece al cliente
    const lista = await this.obtenerPorId(id_lista, id_cliente);
    if (!lista) {
      throw new Error('Lista no encontrada o no tienes permiso');
    }

    // Verificar si el proveedor ya está en la lista
    const existe = await this.proveedorEnLista(id_lista, id_proveedor);
    if (existe) {
      throw new Error('El proveedor ya está en esta lista');
    }

    const query = `
      INSERT INTO ListaProveedor (id_lista, id_proveedor, notas)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const valores = [id_lista, id_proveedor, notas];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Verificar si un proveedor está en una lista
  static async proveedorEnLista(id_lista, id_proveedor) {
    const query = `
      SELECT id_lista_proveedor
      FROM ListaProveedor
      WHERE id_lista = $1 AND id_proveedor = $2
    `;
    
    const resultado = await pool.query(query, [id_lista, id_proveedor]);
    return resultado.rows.length > 0;
  }

  // Obtener proveedores de una lista
  static async obtenerProveedoresDeLista(id_lista, id_cliente) {
    // Verificar que la lista pertenece al cliente
    const lista = await this.obtenerPorId(id_lista, id_cliente);
    if (!lista) {
      return null;
    }

    const query = `
      SELECT lp.*,
             p.nombre_negocio,
             p.ciudad,
             p.tipo_servicio,
             p.logo,
             p.calificacion_promedio,
             p.telefono
      FROM ListaProveedor lp
      INNER JOIN Proveedor p ON lp.id_proveedor = p.id_proveedor
      WHERE lp.id_lista = $1
      ORDER BY lp.fecha_agregado DESC
    `;
    
    const resultado = await pool.query(query, [id_lista]);
    return resultado.rows;
  }

  // Actualizar estado del proveedor en la lista
  static async actualizarEstadoProveedor(id_lista_proveedor, id_cliente, nuevoEstado, notas = null) {
    // Verificar que el registro pertenece a una lista del cliente
    const verificacion = await pool.query(`
      SELECT lp.id_lista_proveedor
      FROM ListaProveedor lp
      INNER JOIN Lista l ON lp.id_lista = l.id_lista
      WHERE lp.id_lista_proveedor = $1 AND l.id_cliente = $2
    `, [id_lista_proveedor, id_cliente]);

    if (verificacion.rows.length === 0) {
      return null;
    }

    const query = `
      UPDATE ListaProveedor 
      SET estado = $1,
          notas = COALESCE($2, notas),
          fecha_actualizacion_estado = CURRENT_TIMESTAMP
      WHERE id_lista_proveedor = $3
      RETURNING *
    `;
    
    const valores = [nuevoEstado, notas, id_lista_proveedor];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Actualizar notas del proveedor en la lista
  static async actualizarNotasProveedor(id_lista_proveedor, id_cliente, notas) {
    const verificacion = await pool.query(`
      SELECT lp.id_lista_proveedor
      FROM ListaProveedor lp
      INNER JOIN Lista l ON lp.id_lista = l.id_lista
      WHERE lp.id_lista_proveedor = $1 AND l.id_cliente = $2
    `, [id_lista_proveedor, id_cliente]);

    if (verificacion.rows.length === 0) {
      return null;
    }

    const query = `
      UPDATE ListaProveedor 
      SET notas = $1
      WHERE id_lista_proveedor = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [notas, id_lista_proveedor]);
    return resultado.rows[0];
  }

  // Eliminar proveedor de la lista
  static async eliminarProveedor(id_lista_proveedor, id_cliente) {
    const query = `
      DELETE FROM ListaProveedor 
      WHERE id_lista_proveedor = $1
      AND id_lista IN (
        SELECT id_lista FROM Lista WHERE id_cliente = $2
      )
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_lista_proveedor, id_cliente]);
    return resultado.rows[0];
  }

  // Obtener estadísticas de una lista
  static async obtenerEstadisticas(id_lista, id_cliente) {
    const lista = await this.obtenerPorId(id_lista, id_cliente);
    if (!lista) {
      return null;
    }

    const query = `
      SELECT 
        COUNT(*) as total_proveedores,
        COUNT(CASE WHEN estado = 'Pendiente' THEN 1 END) as pendientes,
        COUNT(CASE WHEN estado = 'Adquirido' THEN 1 END) as adquiridos,
        SUM(CASE WHEN estado = 'Adquirido' THEN 1 ELSE 0 END)::float / 
          NULLIF(COUNT(*), 0) * 100 as porcentaje_completado
      FROM ListaProveedor
      WHERE id_lista = $1
    `;
    
    const resultado = await pool.query(query, [id_lista]);
    return resultado.rows[0];
  }

  // Duplicar lista
  static async duplicar(id_lista, id_cliente, nuevo_nombre) {
    const listaOriginal = await this.obtenerPorId(id_lista, id_cliente);
    if (!listaOriginal) {
      return null;
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Crear nueva lista
      const nuevaLista = await client.query(`
        INSERT INTO Lista (id_cliente, nombre_lista, descripcion)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [id_cliente, nuevo_nombre, listaOriginal.descripcion]);

      const id_nueva_lista = nuevaLista.rows[0].id_lista;

      // Copiar proveedores
      await client.query(`
        INSERT INTO ListaProveedor (id_lista, id_proveedor, estado, notas)
        SELECT $1, id_proveedor, 'Pendiente', notas
        FROM ListaProveedor
        WHERE id_lista = $2
      `, [id_nueva_lista, id_lista]);

      await client.query('COMMIT');
      
      return nuevaLista.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Lista;