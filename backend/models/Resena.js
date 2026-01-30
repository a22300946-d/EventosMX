const pool = require('../config/database');

class Resena {
  
  // Crear una nueva reseña
  static async crear(datos) {
    const { 
      id_cliente, id_proveedor, id_solicitud, 
      comentario, calificacion, sentimiento 
    } = datos;
    
    const query = `
      INSERT INTO Resena 
      (id_cliente, id_proveedor, id_solicitud, comentario, calificacion, sentimiento)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const valores = [
      id_cliente, id_proveedor, id_solicitud, 
      comentario, calificacion, sentimiento
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Obtener reseñas de un proveedor
  static async obtenerPorProveedor(id_proveedor, filtros = {}) {
    let query = `
      SELECT r.*, 
             c.nombre_completo as cliente_nombre,
             c.foto_perfil as cliente_foto,
             s.tipo_evento,
             s.fecha_evento
      FROM Resena r
      INNER JOIN Cliente c ON r.id_cliente = c.id_cliente
      LEFT JOIN Solicitud s ON r.id_solicitud = s.id_solicitud
      WHERE r.id_proveedor = $1
      AND r.visible = true
    `;
    
    const valores = [id_proveedor];
    let contador = 2;

    if (filtros.sentimiento) {
      query += ` AND r.sentimiento = $${contador}`;
      valores.push(filtros.sentimiento);
      contador++;
    }

    if (filtros.calificacion_min) {
      query += ` AND r.calificacion >= $${contador}`;
      valores.push(filtros.calificacion_min);
      contador++;
    }

    query += ` ORDER BY r.fecha_publicacion DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Obtener reseña por ID
  static async obtenerPorId(id_resena) {
    const query = `
      SELECT r.*, 
             c.nombre_completo as cliente_nombre,
             c.foto_perfil as cliente_foto,
             p.nombre_negocio,
             s.tipo_evento,
             s.fecha_evento
      FROM Resena r
      INNER JOIN Cliente c ON r.id_cliente = c.id_cliente
      INNER JOIN Proveedor p ON r.id_proveedor = p.id_proveedor
      LEFT JOIN Solicitud s ON r.id_solicitud = s.id_solicitud
      WHERE r.id_resena = $1
    `;
    
    const resultado = await pool.query(query, [id_resena]);
    return resultado.rows[0];
  }

  // Verificar si el cliente ya dejó reseña para esta solicitud
  static async existeResena(id_cliente, id_solicitud) {
    const query = `
      SELECT id_resena
      FROM Resena
      WHERE id_cliente = $1 AND id_solicitud = $2
    `;
    
    const resultado = await pool.query(query, [id_cliente, id_solicitud]);
    return resultado.rows.length > 0;
  }

  // Obtener estadísticas de reseñas de un proveedor
  static async obtenerEstadisticas(id_proveedor) {
    const query = `
      SELECT 
        COUNT(*) as total_resenas,
        AVG(calificacion) as calificacion_promedio,
        COUNT(CASE WHEN sentimiento = 'positivo' THEN 1 END) as positivas,
        COUNT(CASE WHEN sentimiento = 'neutro' THEN 1 END) as neutras,
        COUNT(CASE WHEN sentimiento = 'negativo' THEN 1 END) as negativas
      FROM Resena
      WHERE id_proveedor = $1
      AND visible = true
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows[0];
  }

  // Reportar reseña
  static async reportar(id_resena, motivo) {
    const query = `
      UPDATE Resena 
      SET reportada = true,
          motivo_reporte = $1
      WHERE id_resena = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [motivo, id_resena]);
    return resultado.rows[0];
  }

  // Ocultar reseña (solo admin)
  static async ocultar(id_resena) {
    const query = `
      UPDATE Resena 
      SET visible = false
      WHERE id_resena = $1
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_resena]);
    return resultado.rows[0];
  }

  // Hacer visible una reseña (solo admin)
  static async hacerVisible(id_resena) {
    const query = `
      UPDATE Resena 
      SET visible = true,
          reportada = false,
          motivo_reporte = NULL
      WHERE id_resena = $1
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_resena]);
    return resultado.rows[0];
  }

  // Obtener reseñas reportadas (solo admin)
  static async obtenerReportadas() {
    const query = `
      SELECT r.*, 
             c.nombre_completo as cliente_nombre,
             p.nombre_negocio
      FROM Resena r
      INNER JOIN Cliente c ON r.id_cliente = c.id_cliente
      INNER JOIN Proveedor p ON r.id_proveedor = p.id_proveedor
      WHERE r.reportada = true
      ORDER BY r.fecha_publicacion DESC
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Eliminar reseña (solo admin o el cliente que la escribió)
  static async eliminar(id_resena, id_cliente = null) {
    let query = `
      DELETE FROM Resena 
      WHERE id_resena = $1
    `;
    
    const valores = [id_resena];
    
    if (id_cliente) {
      query += ` AND id_cliente = $2`;
      valores.push(id_cliente);
    }
    
    query += ` RETURNING *`;
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }
}

module.exports = Resena;