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
    const campos = [];
    const valores = [];
    let contador = 1;

    // Construir dinámicamente la query solo con los campos proporcionados
    if (datos.nombre_completo !== undefined) {
      campos.push(`nombre_completo = $${contador}`);
      valores.push(datos.nombre_completo);
      contador++;
    }

    if (datos.telefono !== undefined) {
      campos.push(`telefono = $${contador}`);
      valores.push(datos.telefono);
      contador++;
    }

    if (datos.ciudad !== undefined) {
      campos.push(`ciudad = $${contador}`);
      valores.push(datos.ciudad);
      contador++;
    }

    if (datos.contrasena !== undefined) {
      campos.push(`contrasena = $${contador}`);
      valores.push(datos.contrasena);
      contador++;
    }

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Agregar el ID al final
    valores.push(id_cliente);

    const query = `
      UPDATE Cliente 
      SET ${campos.join(', ')}
      WHERE id_cliente = $${contador}
      RETURNING id_cliente, nombre_completo, correo, telefono, ciudad, foto_perfil
    `;
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // ⭐ NUEVO: Actualizar solo la foto de perfil
  static async actualizarFotoPerfil(id_cliente, foto_perfil) {
    const query = `
      UPDATE cliente
      SET foto_perfil = $1
      WHERE id_cliente = $2
      RETURNING 
        id_cliente,
        nombre_completo,
        correo,
        telefono,
        ciudad,
        foto_perfil,
        fecha_registro,
        estado_cuenta
    `;
    
    const valores = [foto_perfil, id_cliente];
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