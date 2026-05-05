const pool = require('../config/database');

class Mensaje {
  
  // Crear un nuevo mensaje
  static async crear(datos) {
    const {
      id_solicitud,
      id_remitente,
      tipo_remitente,
      contenido
    } = datos;

    const query = `
      INSERT INTO Mensaje (
        id_solicitud,
        id_remitente,
        tipo_remitente,
        contenido,
        fecha_envio,
        leido
      )
      VALUES ($1, $2, $3, $4, NOW(), false)
      RETURNING *
    `;

    const values = [id_solicitud, id_remitente, tipo_remitente, contenido];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear mensaje:', error);
      throw error;
    }
  }

  // Obtener todos los mensajes de una solicitud
  static async obtenerPorSolicitud(id_solicitud) {
    const query = `
      SELECT 
        m.*,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.nombre_completo
          WHEN m.tipo_remitente = 'proveedor' THEN p.nombre_negocio
        END as nombre_remitente,
        CASE 
          WHEN m.tipo_remitente = 'cliente' THEN c.foto_perfil
          WHEN m.tipo_remitente = 'proveedor' THEN p.logo
        END as foto_remitente
      FROM Mensaje m
      LEFT JOIN Cliente c ON m.id_remitente = c.id_cliente AND m.tipo_remitente = 'cliente'
      LEFT JOIN Proveedor p ON m.id_remitente = p.id_proveedor AND m.tipo_remitente = 'proveedor'
      WHERE m.id_solicitud = $1
      ORDER BY m.fecha_envio ASC
    `;

    try {
      const result = await pool.query(query, [id_solicitud]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      throw error;
    }
  }

  // Marcar un mensaje como leído
  static async marcarComoLeido(id_mensaje) {
    const query = `
      UPDATE Mensaje
      SET leido = true,
          fecha_lectura = NOW()
      WHERE id_mensaje = $1
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id_mensaje]);
      return result.rows[0];
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error);
      throw error;
    }
  }

  // Marcar TODOS los mensajes de una conversación como leídos
  static async marcarTodosComoLeidos(id_solicitud, tipo_usuario, id_usuario) {
    const query = `
      UPDATE Mensaje
      SET leido = true,
          fecha_lectura = NOW()
      WHERE id_solicitud = $1
        AND leido = false
        AND NOT (tipo_remitente = $2 AND id_remitente = $3)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [id_solicitud, tipo_usuario, id_usuario]);
      return result.rows;
    } catch (error) {
      console.error('Error al marcar todos los mensajes como leídos:', error);
      throw error;
    }
  }

  // Contar mensajes no leídos para un usuario
  static async contarNoLeidos(id_usuario, tipo_usuario) {
    const query = `
      SELECT COUNT(*) as total
      FROM Mensaje m
      WHERE m.leido = false
        AND NOT (m.tipo_remitente = $2 AND m.id_remitente = $1)
        AND m.id_solicitud IN (
          SELECT s.id_solicitud
          FROM Solicitud s
          WHERE 
            (s.id_cliente = $1 AND $2 = 'cliente') OR
            (s.id_proveedor = $1 AND $2 = 'proveedor')
        )
    `;

    try {
      const result = await pool.query(query, [id_usuario, tipo_usuario]);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error('Error al contar mensajes no leídos:', error);
      throw error;
    }
  }

  // Obtener conversaciones activas de un usuario
  static async obtenerConversacionesActivas(id_usuario, tipo_usuario) {
    const query = `
      WITH ultimos_mensajes AS (
        SELECT DISTINCT ON (m.id_solicitud)
          m.*,
          CASE 
            WHEN m.tipo_remitente = 'cliente' THEN c.nombre_completo
            WHEN m.tipo_remitente = 'proveedor' THEN p.nombre_negocio
          END as nombre_remitente
        FROM Mensaje m
        LEFT JOIN Cliente c ON m.id_remitente = c.id_cliente AND m.tipo_remitente = 'cliente'
        LEFT JOIN Proveedor p ON m.id_remitente = p.id_proveedor AND m.tipo_remitente = 'proveedor'
        WHERE m.id_solicitud IN (
          SELECT s.id_solicitud
          FROM Solicitud s
          WHERE 
            (s.id_cliente = $1 AND $2 = 'cliente') OR
            (s.id_proveedor = $1 AND $2 = 'proveedor')
        )
        ORDER BY m.id_solicitud, m.fecha_envio DESC
      ),
      mensajes_no_leidos AS (
        SELECT 
          id_solicitud,
          COUNT(*) as no_leidos
        FROM Mensaje
        WHERE leido = false
          AND NOT (tipo_remitente = $2 AND id_remitente = $1)
          AND id_solicitud IN (
            SELECT s.id_solicitud
            FROM Solicitud s
            WHERE 
              (s.id_cliente = $1 AND $2 = 'cliente') OR
              (s.id_proveedor = $1 AND $2 = 'proveedor')
          )
        GROUP BY id_solicitud
      )
      SELECT 
        s.id_solicitud,
        s.id_cliente,
        s.id_proveedor,
        s.estado as estado_solicitud,
        s.fecha_evento,
        s.tipo_evento,
        c.nombre_completo as nombre_cliente,
        c.foto_perfil as foto_cliente,
        p.nombre_negocio as nombre_proveedor,
        p.logo as logo_proveedor,
        um.contenido as ultimo_mensaje,
        um.fecha_envio as fecha_ultimo_mensaje,
        um.tipo_remitente as tipo_ultimo_remitente,
        COALESCE(mnl.no_leidos, 0) as mensajes_no_leidos
      FROM Solicitud s
      INNER JOIN Cliente c ON s.id_cliente = c.id_cliente
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      LEFT JOIN ultimos_mensajes um ON s.id_solicitud = um.id_solicitud
      LEFT JOIN mensajes_no_leidos mnl ON s.id_solicitud = mnl.id_solicitud
      WHERE 
        (s.id_cliente = $1 AND $2 = 'cliente') OR
        (s.id_proveedor = $1 AND $2 = 'proveedor')
      ORDER BY um.fecha_envio DESC NULLS LAST
    `;

    try {
      const result = await pool.query(query, [id_usuario, tipo_usuario]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener conversaciones activas:', error);
      throw error;
    }
  }

  // Verificar si un usuario tiene acceso a una conversación
  static async verificarAcceso(id_solicitud, id_usuario, tipo_usuario) {
    const query = `
      SELECT 1
      FROM Solicitud
      WHERE id_solicitud = $1
        AND (
          (id_cliente = $2 AND $3 = 'cliente') OR
          (id_proveedor = $2 AND $3 = 'proveedor')
        )
    `;

    try {
      const result = await pool.query(query, [id_solicitud, id_usuario, tipo_usuario]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error al verificar acceso:', error);
      throw error;
    }
  }
}

module.exports = Mensaje;