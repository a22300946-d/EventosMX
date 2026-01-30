const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Cliente {
  
  // Crear un nuevo cliente
  static async crear(datos) {
    const { nombre_completo, correo, contrasena, telefono, ciudad } = datos;
    
    // Encriptar contraseña
    const contrasenaHash = await bcrypt.hash(contrasena, 10);
    
    const query = `
      INSERT INTO Cliente (nombre_completo, correo, contrasena, telefono, ciudad)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_cliente, nombre_completo, correo, telefono, ciudad, fecha_registro, estado_cuenta
    `;
    
    const valores = [nombre_completo, correo, contrasenaHash, telefono, ciudad];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Buscar cliente por correo
  static async buscarPorCorreo(correo) {
    const query = 'SELECT * FROM Cliente WHERE correo = $1';
    const resultado = await pool.query(query, [correo]);
    return resultado.rows[0];
  }

  // Buscar cliente por ID
  static async buscarPorId(id_cliente) {
    const query = `
      SELECT id_cliente, nombre_completo, correo, telefono, ciudad, 
             foto_perfil, fecha_registro, estado_cuenta
      FROM Cliente 
      WHERE id_cliente = $1
    `;
    const resultado = await pool.query(query, [id_cliente]);
    return resultado.rows[0];
  }

  // Actualizar perfil
  static async actualizarPerfil(id_cliente, datos) {
    const { nombre_completo, telefono, ciudad, foto_perfil } = datos;
    
    const query = `
      UPDATE Cliente 
      SET nombre_completo = COALESCE($1, nombre_completo),
          telefono = COALESCE($2, telefono),
          ciudad = COALESCE($3, ciudad),
          foto_perfil = COALESCE($4, foto_perfil)
      WHERE id_cliente = $5
      RETURNING id_cliente, nombre_completo, correo, telefono, ciudad, foto_perfil
    `;
    
    const valores = [nombre_completo, telefono, ciudad, foto_perfil, id_cliente];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Verificar contraseña
  static async verificarContrasena(contrasenaPlana, contrasenaHash) {
    return await bcrypt.compare(contrasenaPlana, contrasenaHash);
  }

  // Incrementar intentos fallidos
  static async incrementarIntentosFallidos(id_cliente) {
    const query = `
      UPDATE Cliente 
      SET intentos_fallidos = intentos_fallidos + 1,
          estado_cuenta = CASE 
            WHEN intentos_fallidos >= 4 THEN 'bloqueado'
            ELSE estado_cuenta
          END
      WHERE id_cliente = $1
      RETURNING intentos_fallidos, estado_cuenta
    `;
    const resultado = await pool.query(query, [id_cliente]);
    return resultado.rows[0];
  }

  // Resetear intentos fallidos
  static async resetearIntentosFallidos(id_cliente) {
    const query = 'UPDATE Cliente SET intentos_fallidos = 0 WHERE id_cliente = $1';
    await pool.query(query, [id_cliente]);
  }
}

module.exports = Cliente;