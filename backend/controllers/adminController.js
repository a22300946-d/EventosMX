const Administrador = require('../models/Administrador');
const Proveedor = require('../models/Proveedor');
const pool = require('../config/database');
const { generarToken } = require('../utils/jwt');

// ── AUTENTICACIÓN ─────────────────────────────────────────────

const loginAdmin = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios' });
    }
    const admin = await Administrador.buscarPorCorreo(correo);
    if (!admin) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    const contrasenaValida = await Administrador.verificarContrasena(contrasena, admin.contrasena);
    if (!contrasenaValida) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    const token = generarToken({ id: admin.id_administrador, correo: admin.correo, rol: 'admin' });
    delete admin.contrasena;
    res.json({ success: true, message: 'Inicio de sesión exitoso', data: { admin, token } });
  } catch (error) {
    console.error('Error en loginAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al iniciar sesión', error: error.message });
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    const admin = await Administrador.buscarPorId(req.usuario.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Administrador no encontrado' });
    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener perfil', error: error.message });
  }
};

// ── MÓDULO CLIENTES ───────────────────────────────────────────

const obtenerClientes = async (req, res) => {
  try {
    const query = `
      SELECT id_cliente, nombre_completo, correo, telefono, ciudad,
             fecha_registro, estado_cuenta, intentos_fallidos
      FROM cliente
      ORDER BY fecha_registro DESC
    `;
    const resultado = await pool.query(query);
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerClientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message });
  }
};

const cambiarEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!['activo', 'bloqueado'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido. Use activo o bloqueado' });
    }
    const query = `
      UPDATE cliente
      SET estado_cuenta = $1::varchar,
          intentos_fallidos = CASE WHEN $1::varchar = 'activo' THEN 0 ELSE intentos_fallidos END
      WHERE id_cliente = $2
      RETURNING id_cliente, nombre_completo, correo, estado_cuenta
    `;
    const resultado = await pool.query(query, [estado, id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }
    const accion = estado === 'bloqueado' ? 'bloqueado' : 'desbloqueado';
    res.json({ success: true, message: `Cliente ${accion} correctamente`, data: resultado.rows[0] });
  } catch (error) {
    console.error('Error en cambiarEstadoCliente:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
  }
};

// ── MÓDULO PROVEEDORES ────────────────────────────────────────

const obtenerProveedores = async (req, res) => {
  try {
    const query = `
      SELECT id_proveedor, nombre_negocio, correo, telefono, ciudad,
             tipo_servicio, estado_aprobacion, estado_cuenta,
             calificacion_promedio, fecha_registro, intentos_fallidos
      FROM proveedor
      ORDER BY fecha_registro DESC
    `;
    const resultado = await pool.query(query);
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerProveedores:', error);
    res.status(500).json({ success: false, message: 'Error al obtener proveedores', error: error.message });
  }
};

const cambiarEstadoProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    if (!['activo', 'bloqueado'].includes(estado)) {
      return res.status(400).json({ success: false, message: 'Estado inválido. Use activo o bloqueado' });
    }
    const query = `
      UPDATE proveedor
      SET estado_cuenta = $1::varchar,
          intentos_fallidos = CASE WHEN $1::varchar = 'activo' THEN 0 ELSE intentos_fallidos END
      WHERE id_proveedor = $2
      RETURNING id_proveedor, nombre_negocio, correo, estado_cuenta
    `;
    const resultado = await pool.query(query, [estado, id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }
    const accion = estado === 'bloqueado' ? 'bloqueado' : 'desbloqueado';
    res.json({ success: true, message: `Proveedor ${accion} correctamente`, data: resultado.rows[0] });
  } catch (error) {
    console.error('Error en cambiarEstadoProveedor:', error);
    res.status(500).json({ success: false, message: 'Error al cambiar estado', error: error.message });
  }
};

// ── MÓDULO SOLICITUDES DE PROVEEDORES ─────────────────────────

const obtenerSolicitudesPendientes = async (req, res) => {
  try {
    const query = `
      SELECT id_proveedor, nombre_negocio, correo, telefono, ciudad,
             tipo_servicio, descripcion, fecha_registro
      FROM proveedor
      WHERE estado_aprobacion = 'pendiente'
      ORDER BY fecha_registro ASC
    `;
    const resultado = await pool.query(query);
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerSolicitudesPendientes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener solicitudes', error: error.message });
  }
};

const resolverSolicitudProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    if (!['aprobado', 'rechazado'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Decisión inválida. Use aprobado o rechazado' });
    }
    const resultado = await Proveedor.cambiarEstadoAprobacion(id, decision);
    if (!resultado) {
      return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
    }

    // Si el proveedor fue aprobado, enviar notificación de bienvenida
    if (decision === 'aprobado') {
      try {
        const titulo = '¡Bienvenido a EventosMX!';
        const mensaje = `¡Felicidades, ${resultado.nombre_negocio}! Un administrador ha revisado y aprobado tu perfil. Tus servicios ahora son visibles para todos los usuarios de la plataforma. ¡Mucho éxito!`;

        const insertQuery = `
          INSERT INTO notificacion (destinatario, titulo, mensaje, fecha_envio)
          VALUES ($1, $2, $3, NOW())
          RETURNING *
        `;
        const notifResult = await pool.query(insertQuery, ['proveedor_' + id, titulo, mensaje]);
        const notif = notifResult.rows[0];

        const { getIO } = require('../config/socket');
        const io = getIO();
        if (io) {
          const eventData = {
            id_notificacion: notif.id_notificacion,
            titulo: notif.titulo,
            mensaje: notif.mensaje,
            fecha_envio: notif.fecha_envio,
            destinatario: notif.destinatario,
            id_proveedor_destino: parseInt(id),
          };
          io.emit('notificacion_bienvenida_proveedor', eventData);
        }
      } catch (notifError) {
        console.error('Error al enviar notificación de bienvenida (no crítico):', notifError);
      }
    }

    const accion = decision === 'aprobado' ? 'aprobado' : 'rechazado';
    res.json({ success: true, message: `Proveedor ${accion} correctamente`, data: resultado });
  } catch (error) {
    console.error('Error en resolverSolicitudProveedor:', error);
    res.status(500).json({ success: false, message: 'Error al procesar solicitud', error: error.message });
  }
};

// ── MÓDULO MODERAR RESEÑAS ────────────────────────────────────

const obtenerResenasNoPositivas = async (req, res) => {
  try {
    const query = `
      SELECT r.id_resena, r.comentario, r.calificacion, r.sentimiento,
             r.fecha_publicacion, r.reportada, r.fecha_reporte,
             c.id_cliente, c.nombre_completo AS nombre_cliente,
             p.nombre_negocio
      FROM resena r
      JOIN cliente c ON c.id_cliente = r.id_cliente
      JOIN proveedor p ON p.id_proveedor = r.id_proveedor
      WHERE r.reportada = true
        AND r.visible = true
      ORDER BY r.fecha_reporte DESC NULLS LAST
    `;
    const resultado = await pool.query(query);
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerResenasNoPositivas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener reseñas', error: error.message });
  }
};

const eliminarResena = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE resena
      SET visible = false
      WHERE id_resena = $1
      RETURNING id_resena
    `;
    const resultado = await pool.query(query, [id]);
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
    }
    res.json({ success: true, message: 'Reseña eliminada correctamente' });
  } catch (error) {
    console.error('Error en eliminarResena:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar reseña', error: error.message });
  }
};

// ── MÓDULO CATÁLOGOS ──────────────────────────────────────────

// ── Ciudades (tabla: lugares) ─────────────────────────────────
const obtenerCiudades = async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id_lugar, ciudad AS nombre_ciudad, estado FROM lugares ORDER BY ciudad ASC'
    );
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerCiudades:', error);
    res.status(500).json({ success: false, message: 'Error al obtener ciudades', error: error.message });
  }
};

const crearCiudad = async (req, res) => {
  try {
    // FIX: se recibe estado desde el frontend; si no viene, se usa 'Jalisco' por defecto
    const { nombre_ciudad, estado = 'Jalisco' } = req.body;
    if (!nombre_ciudad || !nombre_ciudad.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre de la ciudad es obligatorio' });
    }
    const resultado = await pool.query(
      `INSERT INTO lugares (ciudad, estado)
       VALUES ($1, $2)
       RETURNING id_lugar, ciudad AS nombre_ciudad, estado`,
      [nombre_ciudad.trim(), estado.trim()]
    );
    res.status(201).json({ success: true, message: 'Ciudad creada correctamente', data: resultado.rows[0] });
  } catch (error) {
    console.error('Error en crearCiudad:', error);
    res.status(500).json({ success: false, message: 'Error al crear ciudad', error: error.message });
  }
};

const eliminarCiudad = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM lugares WHERE id_lugar = $1 RETURNING id_lugar',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ciudad no encontrada' });
    }
    res.json({ success: true, message: 'Ciudad eliminada correctamente' });
  } catch (error) {
    console.error('Error en eliminarCiudad:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar ciudad', error: error.message });
  }
};

// ── Categorías / Tipos de servicio (tabla: categoria) ─────────
const obtenerCategoriasAdmin = async (req, res) => {
  try {
    const resultado = await pool.query(
      'SELECT id_categoria, nombre_categoria, icono FROM categoria ORDER BY nombre_categoria ASC'
    );
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerCategoriasAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener categorías', error: error.message });
  }
};

const crearCategoriaAdmin = async (req, res) => {
  try {
    const { nombre_categoria, icono } = req.body;
    if (!nombre_categoria || !nombre_categoria.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
    }

    // FIX: reparar la secuencia antes de insertar para evitar "duplicate key"
    // Esto es seguro de correr siempre; solo actualiza si la secuencia está atrasada
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('categoria', 'id_categoria'),
        COALESCE((SELECT MAX(id_categoria) FROM categoria), 0)
      )
    `);

    const resultado = await pool.query(
      `INSERT INTO categoria (nombre_categoria, icono)
       VALUES ($1, $2)
       RETURNING id_categoria, nombre_categoria, icono`,
      [nombre_categoria.trim(), icono ? icono.trim() : null]
    );
    res.status(201).json({ success: true, message: 'Categoría creada correctamente', data: resultado.rows[0] });
  } catch (error) {
    console.error('Error en crearCategoriaAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al crear categoría', error: error.message });
  }
};

const eliminarCategoriaAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM categoria WHERE id_categoria = $1 RETURNING id_categoria',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, message: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error en eliminarCategoriaAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar categoría', error: error.message });
  }
};

// ── Tipos de evento (tabla: tipoevento) ───────────────────────
const obtenerTiposEventoAdmin = async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT id_tipo_evento, nombre_evento AS nombre_tipo, icono
       FROM tipoevento
       ORDER BY nombre_evento ASC`
    );
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerTiposEventoAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al obtener tipos de evento', error: error.message });
  }
};

const crearTipoEventoAdmin = async (req, res) => {
  try {
    const { nombre_tipo, icono } = req.body;
    if (!nombre_tipo || !nombre_tipo.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del tipo de evento es obligatorio' });
    }

    // FIX: reparar secuencia antes de insertar (mismo patrón que categorías)
    await pool.query(`
      SELECT setval(
        pg_get_serial_sequence('tipoevento', 'id_tipo_evento'),
        COALESCE((SELECT MAX(id_tipo_evento) FROM tipoevento), 0)
      )
    `);

    // FIX: ahora también guarda el icono
    const resultado = await pool.query(
      `INSERT INTO tipoevento (nombre_evento, icono)
       VALUES ($1, $2)
       RETURNING id_tipo_evento, nombre_evento AS nombre_tipo, icono`,
      [nombre_tipo.trim(), icono ? icono.trim() : null]
    );
    res.status(201).json({ success: true, message: 'Tipo de evento creado correctamente', data: resultado.rows[0] });
  } catch (error) {
    console.error('Error en crearTipoEventoAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al crear tipo de evento', error: error.message });
  }
};

const eliminarTipoEventoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const resultado = await pool.query(
      'DELETE FROM tipoevento WHERE id_tipo_evento = $1 RETURNING id_tipo_evento',
      [id]
    );
    if (resultado.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tipo de evento no encontrado' });
    }
    res.json({ success: true, message: 'Tipo de evento eliminado correctamente' });
  } catch (error) {
    console.error('Error en eliminarTipoEventoAdmin:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar tipo de evento', error: error.message });
  }
};

// ── MÓDULO NOTIFICACIONES ─────────────────────────────────────

const enviarNotificacion = async (req, res) => {
  try {
    const { destinatario, titulo, mensaje } = req.body;
    if (!destinatario || !titulo?.trim() || !mensaje?.trim()) {
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
    }

    const insertQuery = `
      INSERT INTO notificacion (destinatario, titulo, mensaje, fecha_envio)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `;
    const resultado = await pool.query(insertQuery, [destinatario, titulo.trim(), mensaje.trim()]);
    const notif = resultado.rows[0];

    const { getIO } = require('../config/socket');
    const io = getIO();
    if (io) {
      const eventData = {
        id: notif.id_notificacion,
        titulo: notif.titulo,
        mensaje: notif.mensaje,
        fecha: notif.fecha_envio,
        destinatario: notif.destinatario,
      };
      if (destinatario === 'todos') {
        io.emit('nueva_notificacion', eventData);
      } else if (destinatario === 'clientes' || destinatario === 'clientes_sin_contratacion') {
        io.emit('nueva_notificacion_cliente', eventData);
      } else if (
        destinatario === 'proveedores' ||
        destinatario === 'proveedores_pendientes' ||
        destinatario === 'proveedores_sin_servicio'
      ) {
        io.emit('nueva_notificacion_proveedor', eventData);
      }
    }

    res.json({ success: true, message: 'Notificación enviada correctamente', data: notif });
  } catch (error) {
    console.error('Error en enviarNotificacion:', error);
    res.status(500).json({ success: false, message: 'Error al enviar notificación', error: error.message });
  }
};

const obtenerNotificaciones = async (req, res) => {
  try {
    const { rol } = req.query;
    let whereClause = '';
    const params = [];

    if (rol === 'cliente') {
      // Obtener fecha_registro del cliente para filtrar notificaciones posteriores
      const idCliente = req.usuario?.id;
      let fechaRegistro = null;
      if (idCliente) {
        const resFecha = await pool.query(
          'SELECT fecha_registro FROM cliente WHERE id_cliente = $1',
          [idCliente]
        );
        fechaRegistro = resFecha.rows[0]?.fecha_registro || null;
      }
      if (fechaRegistro) {
        whereClause = `WHERE destinatario IN ('todos', 'clientes', 'clientes_sin_contratacion') AND fecha_envio >= $1`;
        params.push(fechaRegistro);
      } else {
        whereClause = `WHERE destinatario IN ('todos', 'clientes', 'clientes_sin_contratacion')`;
      }
    } else if (rol === 'proveedor') {
      const idProveedor = req.usuario?.id;
      let fechaRegistro = null;
      if (idProveedor) {
        const resFecha = await pool.query(
          'SELECT fecha_registro FROM proveedor WHERE id_proveedor = $1',
          [idProveedor]
        );
        fechaRegistro = resFecha.rows[0]?.fecha_registro || null;
      }
      if (idProveedor && fechaRegistro) {
        whereClause = `WHERE destinatario IN ('todos', 'proveedores', 'proveedores_pendientes', 'proveedores_sin_servicio', 'proveedor_${idProveedor}') AND fecha_envio >= $1`;
        params.push(fechaRegistro);
      } else if (idProveedor) {
        whereClause = `WHERE destinatario IN ('todos', 'proveedores', 'proveedores_pendientes', 'proveedores_sin_servicio', 'proveedor_${idProveedor}')`;
      } else {
        whereClause = `WHERE destinatario IN ('todos', 'proveedores', 'proveedores_pendientes', 'proveedores_sin_servicio')`;
      }
    }

    const query = `
      SELECT id_notificacion, destinatario, titulo, mensaje, fecha_envio
      FROM notificacion
      ${whereClause}
      ORDER BY fecha_envio DESC
      LIMIT 50
    `;
    const resultado = await pool.query(query, params);
    res.json({ success: true, data: resultado.rows });
  } catch (error) {
    console.error('Error en obtenerNotificaciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener notificaciones', error: error.message });
  }
};

module.exports = {
  loginAdmin,
  obtenerPerfil,
  obtenerClientes,
  cambiarEstadoCliente,
  obtenerProveedores,
  cambiarEstadoProveedor,
  obtenerSolicitudesPendientes,
  resolverSolicitudProveedor,
  obtenerResenasNoPositivas,
  eliminarResena,
  // Catálogos
  obtenerCiudades,
  crearCiudad,
  eliminarCiudad,
  obtenerCategoriasAdmin,
  crearCategoriaAdmin,
  eliminarCategoriaAdmin,
  obtenerTiposEventoAdmin,
  crearTipoEventoAdmin,
  eliminarTipoEventoAdmin,
  // Notificaciones
  enviarNotificacion,
  obtenerNotificaciones,
};