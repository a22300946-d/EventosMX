const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Proveedor {
  
  // Crear un nuevo proveedor
  static async crear(datos) {
    const { 
      nombre_negocio, correo, contrasena, telefono, 
      ciudad, tipo_servicio, descripcion 
    } = datos;
    
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    
    const query = `
      INSERT INTO Proveedor 
      (nombre_negocio, correo, contrasena, telefono, ciudad, tipo_servicio, descripcion)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id_proveedor, nombre_negocio, correo, telefono, ciudad, 
                tipo_servicio, descripcion, estado_aprobacion, fecha_registro
    `;
    
    const valores = [
      nombre_negocio, correo, contrasenaHash, 
      telefono, ciudad, tipo_servicio, descripcion
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Buscar proveedor por correo
  static async buscarPorCorreo(correo) {
    const query = 'SELECT * FROM Proveedor WHERE correo = $1';
    const resultado = await pool.query(query, [correo]);
    return resultado.rows[0];
  }

  // Buscar proveedor por ID
  static async buscarPorId(id_proveedor) {
    const query = `
      SELECT id_proveedor, nombre_negocio, correo, telefono, ciudad,
             tipo_servicio, descripcion, logo, estado_aprobacion,
             calificacion_promedio, fecha_registro, estado_cuenta
      FROM Proveedor 
      WHERE id_proveedor = $1
    `;
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows[0];
  }

  // Buscar proveedores con filtros
  static async buscarConFiltros(filtros = {}) {
    let query = `
      SELECT id_proveedor, nombre_negocio, ciudad, tipo_servicio,
             descripcion, logo, calificacion_promedio, estado_aprobacion
      FROM Proveedor 
      WHERE estado_aprobacion = 'aprobado' AND estado_cuenta = 'activo'
    `;
    
    const valores = [];
    let contador = 1;

      if (filtros.nombre_proveedor) {
    query += ` AND nombre_negocio ILIKE $${contador}`;
    valores.push(`%${filtros.nombre_proveedor}%`);
    contador++;
  }
  
    if (filtros.ciudad) {
      query += ` AND ciudad ILIKE $${contador}`;
      valores.push(`%${filtros.ciudad}%`);
      contador++;
    }

    if (filtros.tipo_servicio) {
      query += ` AND tipo_servicio ILIKE $${contador}`;
      valores.push(`%${filtros.tipo_servicio}%`);
      contador++;
    }

    if (filtros.calificacion_min) {
      query += ` AND calificacion_promedio >= $${contador}`;
      valores.push(filtros.calificacion_min);
      contador++;
    }

    query += ` ORDER BY calificacion_promedio DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Actualizar perfil de proveedor
  static async actualizarPerfil(id_proveedor, datos) {
    const { 
      nombre_negocio, telefono, ciudad, tipo_servicio, 
      descripcion, logo 
    } = datos;
    
    const query = `
      UPDATE Proveedor 
      SET nombre_negocio = COALESCE($1, nombre_negocio),
          telefono = COALESCE($2, telefono),
          ciudad = COALESCE($3, ciudad),
          tipo_servicio = COALESCE($4, tipo_servicio),
          descripcion = COALESCE($5, descripcion),
          logo = COALESCE($6, logo)
      WHERE id_proveedor = $7
      RETURNING id_proveedor, nombre_negocio, telefono, ciudad, 
                tipo_servicio, descripcion, logo
    `;
    
    const valores = [
      nombre_negocio, telefono, ciudad, tipo_servicio, 
      descripcion, logo, id_proveedor
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Verificar contraseña
  static async verificarContrasena(contrasenaPlana, contrasenaHash) {
    return await bcrypt.compare(contrasenaPlana, contrasenaHash);
  }

  // Cambiar estado de aprobación (solo admin)
  static async cambiarEstadoAprobacion(id_proveedor, nuevoEstado) {
    const query = `
      UPDATE Proveedor 
      SET estado_aprobacion = $1
      WHERE id_proveedor = $2
      RETURNING id_proveedor, nombre_negocio, estado_aprobacion
    `;
    const resultado = await pool.query(query, [nuevoEstado, id_proveedor]);
    return resultado.rows[0];
  }
}

module.exports = Proveedor;