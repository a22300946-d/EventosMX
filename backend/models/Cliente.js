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

  // Actualizar solo la foto de perfil
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

  /**
   * Registrar un intento fallido de login.
   *
   * Lógica de dos fases:
   *   Fase 1 – bloqueo temporal:
   *     Al llegar a max_intentos la cuenta se bloquea temporalmente:
   *     se guarda fecha_bloqueo, se incrementa contador_bloqueos y se
   *     resetean intentos_fallidos a 0. estado_cuenta permanece 'activo'.
   *
   *   Fase 2 – bloqueo permanente:
   *     Si el usuario ya cumplió al menos un bloqueo temporal (contador_bloqueos >= 1)
   *     y vuelve a agotar sus intentos, la cuenta pasa a 'bloqueado' de forma
   *     definitiva; solo el administrador puede reactivarla.
   *
   * Retorna el registro actualizado con todos los campos de bloqueo.
   */
  static async registrarIntentoFallido(id_cliente, maxIntentos) {
    // Usamos una transacción para leer-y-escribir de forma atómica
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Leer estado actual
      const { rows } = await client.query(
        `SELECT intentos_fallidos, contador_bloqueos, estado_cuenta
         FROM Cliente WHERE id_cliente = $1 FOR UPDATE`,
        [id_cliente]
      );
      const row = rows[0];
      const nuevosIntentos = row.intentos_fallidos + 1;
      const yaBloqueoAntes = row.contador_bloqueos >= 1;

      let updateQuery;
      let updateValues;

      if (nuevosIntentos >= maxIntentos) {
        if (yaBloqueoAntes) {
          // ── Fase 2: bloqueo permanente ───────────────────────────────────
          updateQuery = `
            UPDATE Cliente
            SET intentos_fallidos  = $1,
                estado_cuenta      = 'bloqueado',
                fecha_bloqueo      = NULL,
                contador_bloqueos  = contador_bloqueos + 1
            WHERE id_cliente = $2
            RETURNING intentos_fallidos, estado_cuenta, fecha_bloqueo, contador_bloqueos
          `;
          updateValues = [nuevosIntentos, id_cliente];
        } else {
          // ── Fase 1: bloqueo temporal ─────────────────────────────────────
          updateQuery = `
            UPDATE Cliente
            SET intentos_fallidos  = 0,
                estado_cuenta      = 'activo',
                fecha_bloqueo      = NOW(),
                contador_bloqueos  = contador_bloqueos + 1
            WHERE id_cliente = $1
            RETURNING intentos_fallidos, estado_cuenta, fecha_bloqueo, contador_bloqueos
          `;
          updateValues = [id_cliente];
        }
      } else {
        // ── Intento fallido sin llegar al límite ─────────────────────────
        updateQuery = `
          UPDATE Cliente
          SET intentos_fallidos = $1
          WHERE id_cliente = $2
          RETURNING intentos_fallidos, estado_cuenta, fecha_bloqueo, contador_bloqueos
        `;
        updateValues = [nuevosIntentos, id_cliente];
      }

      const resultado = await client.query(updateQuery, updateValues);
      await client.query('COMMIT');
      return resultado.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // Resetear intentos fallidos y fecha_bloqueo tras login exitoso
  static async resetearIntentosFallidos(id_cliente) {
    const query = `
      UPDATE Cliente
      SET intentos_fallidos = 0,
          fecha_bloqueo     = NULL
      WHERE id_cliente = $1
    `;
    await pool.query(query, [id_cliente]);
  }
}

module.exports = Cliente;