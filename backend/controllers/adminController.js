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
             r.fecha_publicacion, r.reportada,
             c.id_cliente, c.nombre_completo AS nombre_cliente,
             p.nombre_negocio
      FROM resena r
      JOIN cliente c ON c.id_cliente = r.id_cliente
      JOIN proveedor p ON p.id_proveedor = r.id_proveedor
      WHERE r.sentimiento IN ('neutro', 'negativo')
        AND r.visible = true
      ORDER BY r.reportada DESC, r.fecha_publicacion DESC
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
};