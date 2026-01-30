const pool = require('../config/database');

class Solicitud {
  
  // Crear una nueva solicitud
  static async crear(datos) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      id_cliente,
      id_proveedor,
      fecha_evento,
      numero_invitados,
      tipo_evento,
      presupuesto_estimado,
      descripcion_solicitud,
      servicios_solicitados = [] 
    } = datos;

    // Crear la solicitud
    const querySolicitud = `
      INSERT INTO Solicitud (
        id_cliente, id_proveedor, fecha_evento, numero_invitados,
        tipo_evento, presupuesto_estimado, descripcion_solicitud
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      id_cliente,
      id_proveedor,
      fecha_evento,
      numero_invitados || null,
      tipo_evento,
      presupuesto_estimado || null,
      descripcion_solicitud || null
    ];

    const result = await client.query(querySolicitud, values);
    const solicitud = result.rows[0];

    // Insertar servicios solicitados si existen
    if (servicios_solicitados && servicios_solicitados.length > 0) {
      const queryServicios = `
        INSERT INTO Solicitud_Servicio (id_solicitud, id_servicio)
        VALUES ($1, $2)
      `;

      for (const id_servicio of servicios_solicitados) {
        await client.query(queryServicios, [solicitud.id_solicitud, id_servicio]);
      }
    }

    await client.query('COMMIT');
    
    return solicitud;

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Obtener servicios asociados a una solicitud
static async obtenerServicios(id_solicitud) {
  const query = `
    SELECT 
      s.id_servicio,
      s.nombre_servicio,
      s.descripcion,
      s.precio,
      s.tipo_precio
    FROM Solicitud_Servicio ss
    INNER JOIN Servicio s ON ss.id_servicio = s.id_servicio
    WHERE ss.id_solicitud = $1
    ORDER BY s.nombre_servicio
  `;

  const result = await pool.query(query, [id_solicitud]);
  return result.rows;
}

  // Obtener solicitud por ID con información completa
  static async obtenerPorId(id_solicitud) {
    const query = `
      SELECT s.*,
             c.nombre_completo as cliente_nombre, c.correo as cliente_correo, 
             c.telefono as cliente_telefono, c.ciudad as cliente_ciudad,
             p.nombre_negocio, p.correo as proveedor_correo, 
             p.telefono as proveedor_telefono, p.ciudad as proveedor_ciudad
      FROM Solicitud s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.id_solicitud = $1
    `;
    
    const resultado = await pool.query(query, [id_solicitud]);
    return resultado.rows[0];
  }

  // Obtener solicitudes del cliente
  static async obtenerPorCliente(id_cliente, filtros = {}) {
    let query = `
      SELECT s.*, 
             p.nombre_negocio, p.logo, p.ciudad as proveedor_ciudad,
             p.tipo_servicio, p.calificacion_promedio
      FROM Solicitud s
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.id_cliente = $1
    `;
    
    const valores = [id_cliente];
    let contador = 2;

    if (filtros.estado) {
      query += ` AND s.estado = $${contador}`;
      valores.push(filtros.estado);
      contador++;
    }

    query += ` ORDER BY s.fecha_envio DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Obtener solicitudes del proveedor
  static async obtenerPorProveedor(id_proveedor, filtros = {}) {
    let query = `
      SELECT s.*, 
             c.nombre_completo as cliente_nombre, c.telefono as cliente_telefono,
             c.ciudad as cliente_ciudad
      FROM Solicitud s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      WHERE s.id_proveedor = $1
    `;
    
    const valores = [id_proveedor];
    let contador = 2;

    if (filtros.estado) {
      query += ` AND s.estado = $${contador}`;
      valores.push(filtros.estado);
      contador++;
    }

    query += ` ORDER BY s.fecha_envio DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Actualizar estado de la solicitud
  static async actualizarEstado(id_solicitud, nuevoEstado, id_usuario, rol) {
    let query = `
      UPDATE Solicitud 
      SET estado = $1
    `;
    
    const valores = [nuevoEstado, id_solicitud];
    let contador = 3;

    // Actualizar fecha según el nuevo estado
    if (nuevoEstado === 'Respondida') {
      query += `, fecha_respuesta = CURRENT_TIMESTAMP`;
    } else if (nuevoEstado === 'Aceptada') {
      query += `, fecha_aceptacion = CURRENT_TIMESTAMP`;
    }

    query += ` WHERE id_solicitud = $2`;

    // Verificar permisos según el rol
    if (rol === 'cliente') {
      query += ` AND id_cliente = $${contador}`;
      valores.push(id_usuario);
    } else if (rol === 'proveedor') {
      query += ` AND id_proveedor = $${contador}`;
      valores.push(id_usuario);
    }

    query += ` RETURNING *`;

    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Marcar notificación como enviada
  static async marcarNotificacionEnviada(id_solicitud) {
    const query = `
      UPDATE Solicitud 
      SET notificacion_enviada = true 
      WHERE id_solicitud = $1
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_solicitud]);
    return resultado.rows[0];
  }

  // Actualizar tiempo sin respuesta
  static async actualizarTiempoSinRespuesta(id_solicitud) {
    const query = `
      UPDATE Solicitud 
      SET tiempo_sin_respuesta = CURRENT_TIMESTAMP 
      WHERE id_solicitud = $1
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_solicitud]);
    return resultado.rows[0];
  }

  // Obtener solicitudes pendientes sin respuesta (para notificaciones)
  static async obtenerPendientesSinRespuesta(horasLimite = 24) {
    const query = `
      SELECT s.*, p.correo as proveedor_correo, p.nombre_negocio
      FROM Solicitud s
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.estado = 'Pendiente'
      AND s.notificacion_enviada = false
      AND s.fecha_envio < NOW() - INTERVAL '${horasLimite} hours'
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Eliminar solicitud (solo si está en estado Pendiente)
  static async eliminar(id_solicitud, id_cliente) {
    const query = `
      DELETE FROM Solicitud 
      WHERE id_solicitud = $1 
      AND id_cliente = $2 
      AND estado = 'Pendiente'
      RETURNING id_solicitud
    `;
    
    const resultado = await pool.query(query, [id_solicitud, id_cliente]);
    return resultado.rows[0];
  }

  // Verificar si el cliente puede dejar reseña
  static async puedeDejarResena(id_cliente, id_proveedor) {
    const query = `
      SELECT COUNT(*) as total
      FROM Solicitud
      WHERE id_cliente = $1 
      AND id_proveedor = $2
      AND estado = 'Aceptada'
      AND fecha_evento < CURRENT_DATE
    `;
    
    const resultado = await pool.query(query, [id_cliente, id_proveedor]);
    return parseInt(resultado.rows[0].total) > 0;
  }

  // Responder solicitud con propuesta (proveedor)
  static async responderConPropuesta(id_solicitud, id_proveedor, propuesta) {
    const { 
      mensaje_respuesta, 
      precio_propuesto, 
      detalles_servicio,
      fecha_disponible 
    } = propuesta;
    
    const query = `
      UPDATE Solicitud 
      SET estado = 'Respondida',
          fecha_respuesta = CURRENT_TIMESTAMP,
          mensaje_respuesta = $1,
          precio_propuesto = $2,
          detalles_servicio = $3,
          fecha_disponible = $4
      WHERE id_solicitud = $5 AND id_proveedor = $6
      RETURNING *
    `;
    
    const valores = [
      mensaje_respuesta,
      precio_propuesto,
      detalles_servicio,
      fecha_disponible,
      id_solicitud,
      id_proveedor
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }
}

module.exports = Solicitud;