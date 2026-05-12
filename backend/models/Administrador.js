const pool = require('../config/database');
const bcrypt = require('bcrypt');

class Administrador {

  // Buscar administrador por correo
  static async buscarPorCorreo(correo) {
    const query = 'SELECT * FROM administrador WHERE correo = $1';
    const resultado = await pool.query(query, [correo]);
    return resultado.rows[0];
  }

  // Buscar administrador por ID
  static async buscarPorId(id_administrador) {
    const query = `
      SELECT id_administrador, nombre, correo, fecha_registro
      FROM administrador
      WHERE id_administrador = $1
    `;
    const resultado = await pool.query(query, [id_administrador]);
    return resultado.rows[0];
  }

  // Verificar contraseña
  static async verificarContrasena(contrasenaPlana, contrasenaHash) {
    return await bcrypt.compare(contrasenaPlana, contrasenaHash);
  }
}

module.exports = Administrador;