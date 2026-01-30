const pool = require('../config/database');

class Mensaje {
  
  // Crear un nuevo mensaje
  static async crear(datos) {
    const { id_solicitud, id_remitente, tipo_remitente, contenido } = datos;
    
    const query = `
      INSERT INTO Mensaje (id_solicitud, id_remitente, tipo_remitente, contenido)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const valores = [id_solicitud, id_remitente, tipo_remitente, contenido];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Obtener mensajes de una solicitud
  static async obtenerPorSolicitud(id_solicitud) {
    const query = `
      SELECT m.*,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.nombre_completo
          WHEN m.tipo_remitente = 'proveedor' THEN p.nombre_negocio
        END as nombre_remitente,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.foto_perfil
          WHEN m.tipo_remitente = 'proveedor' THEN p.logo
        END as foto_remitente
      FROM Mensaje m
      LEFT JOIN Cliente c ON m.tipo_remitente = 'cliente' AND m.id_remitente = c.id_cliente
      LEFT JOIN Proveedor p ON m.tipo_remitente = 'proveedor' AND m.id_remitente = p.id_proveedor
      WHERE m.id_solicitud = $1
      ORDER BY m.fecha_envio ASC
    `;
    
    const resultado = await pool.query(query, [id_solicitud]);
    return resultado.rows;
  }

  // Marcar mensajes como leídos
  static async marcarComoLeido(id_solicitud, id_usuario, tipo_usuario) {
    const query = `
      UPDATE Mensaje 
      SET leido = true,
          fecha_lectura = CURRENT_TIMESTAMP
      WHERE id_solicitud = $1 
      AND NOT (id_remitente = $2 AND tipo_remitente = $3)
      AND leido = false
      RETURNING *
    `;
    
    const valores = [id_solicitud, id_usuario, tipo_usuario];
    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Contar mensajes no leídos por solicitud
  static async contarNoLeidos(id_solicitud, id_usuario, tipo_usuario) {
    const query = `
      SELECT COUNT(*) as total
      FROM Mensaje
      WHERE id_solicitud = $1
      AND NOT (id_remitente = $2 AND tipo_remitente = $3)
      AND leido = false
    `;
    
    const valores = [id_solicitud, id_usuario, tipo_usuario];
    const resultado = await pool.query(query, valores);
    return parseInt(resultado.rows[0].total);
  }

  // Obtener conversaciones del cliente (últimos mensajes de cada solicitud)
  static async obtenerConversacionesCliente(id_cliente) {
    const query = `
      SELECT DISTINCT ON (s.id_solicitud)
        s.id_solicitud,
        s.estado,
        s.fecha_evento,
        s.tipo_evento,
        p.nombre_negocio,
        p.logo,
        p.ciudad,
        m.contenido as ultimo_mensaje,
        m.fecha_envio as fecha_ultimo_mensaje,
        m.tipo_remitente as ultimo_remitente,
        (SELECT COUNT(*) FROM Mensaje 
         WHERE id_solicitud = s.id_solicitud 
         AND tipo_remitente = 'proveedor' 
         AND leido = false) as mensajes_no_leidos
      FROM Solicitud s
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      LEFT JOIN Mensaje m ON s.id_solicitud = m.id_solicitud
      WHERE s.id_cliente = $1
      ORDER BY s.id_solicitud, m.fecha_envio DESC NULLS LAST
    `;
    
    const resultado = await pool.query(query, [id_cliente]);
    return resultado.rows;
  }

  // Obtener conversaciones del proveedor
  static async obtenerConversacionesProveedor(id_proveedor) {
    const query = `
      SELECT DISTINCT ON (s.id_solicitud)
        s.id_solicitud,
        s.estado,
        s.fecha_evento,
        s.tipo_evento,
        c.nombre_completo as cliente_nombre,
        c.foto_perfil,
        c.ciudad,
        m.contenido as ultimo_mensaje,
        m.fecha_envio as fecha_ultimo_mensaje,
        m.tipo_remitente as ultimo_remitente,
        (SELECT COUNT(*) FROM Mensaje 
         WHERE id_solicitud = s.id_solicitud 
         AND tipo_remitente = 'cliente' 
         AND leido = false) as mensajes_no_leidos
      FROM Solicitud s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      LEFT JOIN Mensaje m ON s.id_solicitud = m.id_solicitud
      WHERE s.id_proveedor = $1
      ORDER BY s.id_solicitud, m.fecha_envio DESC NULLS LAST
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows;
  }

  // Eliminar mensaje (solo si fue enviado hace menos de 5 minutos)
  static async eliminar(id_mensaje, id_remitente, tipo_remitente) {
    const query = `
      DELETE FROM Mensaje
      WHERE id_mensaje = $1
      AND id_remitente = $2
      AND tipo_remitente = $3
      AND fecha_envio > NOW() - INTERVAL '5 minutes'
      RETURNING id_mensaje
    `;
    
    const valores = [id_mensaje, id_remitente, tipo_remitente];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }
}

module.exports = Mensaje;