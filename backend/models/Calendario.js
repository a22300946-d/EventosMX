const pool = require('../config/database');

class Calendario {
  
  // Obtener calendario del proveedor
  static async obtenerPorProveedor(id_proveedor, filtros = {}) {
    let query = `
      SELECT c.*,
             s.tipo_evento,
             s.numero_invitados,
             cl.nombre_completo as cliente_nombre
      FROM Calendario c
      LEFT JOIN Solicitud s ON c.id_solicitud = s.id_solicitud
      LEFT JOIN Cliente cl ON s.id_cliente = cl.id_cliente
      WHERE c.id_proveedor = $1
    `;
    
    const valores = [id_proveedor];
    let contador = 2;

    if (filtros.fecha_inicio) {
      query += ` AND c.fecha >= $${contador}`;
      valores.push(filtros.fecha_inicio);
      contador++;
    }

    if (filtros.fecha_fin) {
      query += ` AND c.fecha <= $${contador}`;
      valores.push(filtros.fecha_fin);
      contador++;
    }

    if (filtros.disponible !== undefined) {
      query += ` AND c.disponible = $${contador}`;
      valores.push(filtros.disponible);
      contador++;
    }

    query += ` ORDER BY c.fecha ASC`;

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Obtener disponibilidad de una fecha específica
  static async obtenerPorFecha(id_proveedor, fecha) {
    const query = `
      SELECT *
      FROM Calendario
      WHERE id_proveedor = $1 AND fecha = $2
    `;
    
    const resultado = await pool.query(query, [id_proveedor, fecha]);
    return resultado.rows[0];
  }

  // Verificar si una fecha está disponible
  static async estaDisponible(id_proveedor, fecha) {
    const query = `
      SELECT disponible
      FROM Calendario
      WHERE id_proveedor = $1 AND fecha = $2
    `;
    
    const resultado = await pool.query(query, [id_proveedor, fecha]);
    
    // Si no existe registro, la fecha está disponible
    if (resultado.rows.length === 0) {
      return true;
    }
    
    return resultado.rows[0].disponible;
  }

  // Marcar fecha como no disponible
  static async marcarNoDisponible(id_proveedor, fecha, motivo = null, id_solicitud = null) {
    // Verificar si ya existe un registro para esta fecha
    const existe = await this.obtenerPorFecha(id_proveedor, fecha);
    
    if (existe) {
      // Actualizar registro existente
      const query = `
        UPDATE Calendario 
        SET disponible = false,
            motivo = $1,
            id_solicitud = $2,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_proveedor = $3 AND fecha = $4
        RETURNING *
      `;
      
      const resultado = await pool.query(query, [motivo, id_solicitud, id_proveedor, fecha]);
      return resultado.rows[0];
    } else {
      // Crear nuevo registro
      const query = `
        INSERT INTO Calendario (id_proveedor, fecha, disponible, motivo, id_solicitud)
        VALUES ($1, $2, false, $3, $4)
        RETURNING *
      `;
      
      const resultado = await pool.query(query, [id_proveedor, fecha, motivo, id_solicitud]);
      return resultado.rows[0];
    }
  }

  // Marcar fecha como disponible
  static async marcarDisponible(id_proveedor, fecha) {
    // Verificar si ya existe un registro para esta fecha
    const existe = await this.obtenerPorFecha(id_proveedor, fecha);
    
    if (existe) {
      // Actualizar registro existente
      const query = `
        UPDATE Calendario 
        SET disponible = true,
            motivo = NULL,
            id_solicitud = NULL,
            fecha_actualizacion = CURRENT_TIMESTAMP
        WHERE id_proveedor = $1 AND fecha = $2
        RETURNING *
      `;
      
      const resultado = await pool.query(query, [id_proveedor, fecha]);
      return resultado.rows[0];
    } else {
      // Crear nuevo registro
      const query = `
        INSERT INTO Calendario (id_proveedor, fecha, disponible)
        VALUES ($1, $2, true)
        RETURNING *
      `;
      
      const resultado = await pool.query(query, [id_proveedor, fecha]);
      return resultado.rows[0];
    }
  }

  // Bloquear múltiples fechas
  static async bloquearMultiplesFechas(id_proveedor, fechas, motivo = null) {
    const client = await pool.connect();
    const resultados = [];
    
    try {
      await client.query('BEGIN');
      
      for (const fecha of fechas) {
        const resultado = await this.marcarNoDisponible(id_proveedor, fecha, motivo);
        resultados.push(resultado);
      }
      
      await client.query('COMMIT');
      return resultados;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Liberar múltiples fechas
  static async liberarMultiplesFechas(id_proveedor, fechas) {
    const client = await pool.connect();
    const resultados = [];
    
    try {
      await client.query('BEGIN');
      
      for (const fecha of fechas) {
        const resultado = await this.marcarDisponible(id_proveedor, fecha);
        resultados.push(resultado);
      }
      
      await client.query('COMMIT');
      return resultados;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Eliminar fecha del calendario (solo si no está asociada a una solicitud)
  static async eliminar(id_proveedor, fecha) {
    const query = `
      DELETE FROM Calendario 
      WHERE id_proveedor = $1 
      AND fecha = $2
      AND id_solicitud IS NULL
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_proveedor, fecha]);
    return resultado.rows[0];
  }

  // Bloquear automáticamente fechas pasadas
  static async bloquearFechasPasadas() {
    const query = `
      UPDATE Calendario 
      SET disponible = false,
          motivo = 'Fecha pasada'
      WHERE fecha < CURRENT_DATE 
      AND disponible = true
      RETURNING *
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Obtener fechas disponibles en un rango (público)
  static async obtenerDisponibilidadPublica(id_proveedor, fecha_inicio, fecha_fin) {
    const query = `
      WITH fechas_rango AS (
        SELECT generate_series(
          $2::date,
          $3::date,
          '1 day'::interval
        )::date AS fecha
      )
      SELECT 
        fr.fecha,
        COALESCE(c.disponible, true) as disponible,
        c.motivo
      FROM fechas_rango fr
      LEFT JOIN Calendario c ON c.fecha = fr.fecha AND c.id_proveedor = $1
      WHERE fr.fecha >= CURRENT_DATE
      ORDER BY fr.fecha ASC
    `;
    
    const resultado = await pool.query(query, [id_proveedor, fecha_inicio, fecha_fin]);
    return resultado.rows;
  }

  // Obtener estadísticas del calendario
  static async obtenerEstadisticas(id_proveedor, mes = null, anio = null) {
    let query = `
      SELECT 
        COUNT(*) as total_fechas,
        COUNT(CASE WHEN disponible = false THEN 1 END) as fechas_ocupadas,
        COUNT(CASE WHEN disponible = true THEN 1 END) as fechas_libres,
        COUNT(CASE WHEN id_solicitud IS NOT NULL THEN 1 END) as eventos_reservados
      FROM Calendario
      WHERE id_proveedor = $1
    `;
    
    const valores = [id_proveedor];
    let contador = 2;

    if (mes && anio) {
      query += ` AND EXTRACT(MONTH FROM fecha) = $${contador}`;
      valores.push(mes);
      contador++;
      
      query += ` AND EXTRACT(YEAR FROM fecha) = $${contador}`;
      valores.push(anio);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }
}

module.exports = Calendario;