const emailService = require('../services/emailService');
const admin = require('../config/firebase.config');
const Cliente = require('../models/Cliente');
const { generarToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const { eliminarImagen, extraerPublicId } = require('../config/cloudinary');
const pool = require('../config/database');

// ── Leer configuración de bloqueo desde configuracion_timer ──────────────────
async function obtenerConfigBloqueo() {
  try {
    const { rows } = await pool.query(
      `SELECT clave, valor FROM configuracion_timer
       WHERE clave IN ('max_intentos_login', 'tiempo_bloqueo_cliente')`
    );
    const cfg = { max_intentos_login: 5, tiempo_bloqueo_cliente: 10 };
    for (const row of rows) {
      cfg[row.clave] = parseInt(row.valor, 10);
    }
    return cfg;
  } catch {
    return { max_intentos_login: 5, tiempo_bloqueo_cliente: 10 };
  }
}

// ── Registro de cliente ──────────────────────────────────────────────────────
const registrarCliente = async (req, res) => {
  try {
    const { nombre_completo, correo, contrasena, telefono, ciudad } = req.body;

    if (!nombre_completo || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, correo y contraseña son obligatorios'
      });
    }

    const clienteExistente = await Cliente.buscarPorCorreo(correo);
    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    const [nuevoCliente, firebaseUser] = await Promise.all([
      Cliente.crear({ nombre_completo, correo, contrasena, telefono, ciudad }),
      admin.auth().createUser({
        email: correo,
        password: contrasena,
        displayName: nombre_completo,
        emailVerified: false
      })
    ]);

    emailService.enviarVerificacion({ email: correo, nombre: nombre_completo })
      .catch(err => console.error('Error al enviar verificación (no crítico):', err));

    const token = generarToken({
      id: nuevoCliente.id_cliente,
      correo: nuevoCliente.correo,
      rol: 'cliente'
    });

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: { cliente: nuevoCliente, token }
    });

  } catch (error) {
    console.error('Error en registrarCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente',
      error: error.message
    });
  }
};

// ── Login de cliente ─────────────────────────────────────────────────────────
const loginCliente = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const cliente = await Cliente.buscarPorCorreo(correo);
    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // ── Bloqueo permanente ───────────────────────────────────────────────────
    if (cliente.estado_cuenta === 'bloqueado') {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta ha sido bloqueada permanentemente por demasiados intentos fallidos. Contacta al administrador para desbloquearla.',
        tipo_bloqueo: 'permanente'
      });
    }

    // ── Bloqueo temporal activo ──────────────────────────────────────────────
    if (cliente.fecha_bloqueo) {
      const cfg = await obtenerConfigBloqueo();
      const expira = new Date(cliente.fecha_bloqueo);
      expira.setMinutes(expira.getMinutes() + cfg.tiempo_bloqueo_cliente);
      const ahora = new Date();

      if (ahora < expira) {
        const minutosRestantes = Math.ceil((expira - ahora) / 60000);
        return res.status(429).json({
          success: false,
          message: `Cuenta bloqueada temporalmente. Intenta de nuevo en ${minutosRestantes} minuto${minutosRestantes !== 1 ? 's' : ''}.`,
          tipo_bloqueo: 'temporal',
          expira_en: expira.toISOString(),
          minutos_restantes: minutosRestantes
        });
      }

      // El bloqueo temporal ya expiró — limpiar fecha_bloqueo e intentos
      await Cliente.resetearIntentosFallidos(cliente.id_cliente);
      // Refrescar datos del cliente para continuar el login correctamente
      cliente.intentos_fallidos = 0;
      cliente.fecha_bloqueo = null;
    }

    // ── Verificar contraseña y estado Firebase en paralelo ───────────────────
    const [contrasenaValida, firebaseUser] = await Promise.all([
      Cliente.verificarContrasena(contrasena, cliente.contrasena),
      admin.auth().getUserByEmail(correo).catch(err => {
        console.error('Error al verificar Firebase (no crítico):', err);
        return null;
      })
    ]);

    if (!contrasenaValida) {
      const cfg = await obtenerConfigBloqueo();
      const resultado = await Cliente.registrarIntentoFallido(
        cliente.id_cliente,
        cfg.max_intentos_login
      );

      // Bloqueo permanente recién activado
      if (resultado.estado_cuenta === 'bloqueado') {
        return res.status(403).json({
          success: false,
          message: 'Tu cuenta ha sido bloqueada permanentemente por demasiados intentos fallidos. Contacta al administrador para desbloquearla.',
          tipo_bloqueo: 'permanente'
        });
      }

      // Bloqueo temporal recién activado (fecha_bloqueo fue seteada)
      if (resultado.fecha_bloqueo) {
        const expira = new Date(resultado.fecha_bloqueo);
        expira.setMinutes(expira.getMinutes() + cfg.tiempo_bloqueo_cliente);
        return res.status(429).json({
          success: false,
          message: `Demasiados intentos fallidos. Cuenta bloqueada temporalmente durante ${cfg.tiempo_bloqueo_cliente} minutos.`,
          tipo_bloqueo: 'temporal',
          expira_en: expira.toISOString(),
          minutos_restantes: cfg.tiempo_bloqueo_cliente
        });
      }

      // Intento fallido sin bloqueo aún
      const intentosRestantes = cfg.max_intentos_login - resultado.intentos_fallidos;
      return res.status(401).json({
        success: false,
        message: `Credenciales incorrectas. Te quedan ${intentosRestantes} intento${intentosRestantes !== 1 ? 's' : ''} antes de un bloqueo temporal.`,
        intentos_restantes: intentosRestantes
      });
    }

    // ── Verificar email en Firebase ──────────────────────────────────────────
    if (firebaseUser && !firebaseUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        emailVerified: false
      });
    }

    // ── Login exitoso: resetear intentos ─────────────────────────────────────
    Cliente.resetearIntentosFallidos(cliente.id_cliente)
      .catch(err => console.error('Error al resetear intentos:', err));

    const token = generarToken({
      id: cliente.id_cliente,
      correo: cliente.correo,
      rol: 'cliente'
    });

    delete cliente.contrasena;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: { cliente, token }
    });

  } catch (error) {
    console.error('Error en loginCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// ── Obtener perfil del cliente autenticado ───────────────────────────────────
const obtenerPerfil = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    const cliente = await Cliente.buscarPorId(id_cliente);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({ success: true, data: cliente });

  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// ── Actualizar perfil del cliente ────────────────────────────────────────────
const actualizarPerfil = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { nombre_completo, telefono, ciudad, nueva_contrasena } = req.body;

    const datosActualizar = {};

    if (nombre_completo !== undefined) datosActualizar.nombre_completo = nombre_completo;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (ciudad !== undefined) datosActualizar.ciudad = ciudad;

    if (nueva_contrasena) {
      const salt = await bcrypt.genSalt(10);
      datosActualizar.contrasena = await bcrypt.hash(nueva_contrasena, salt);
    }

    const clienteActualizado = await Cliente.actualizarPerfil(id_cliente, datosActualizar);

    if (!clienteActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    delete clienteActualizado.contrasena;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: clienteActualizado
    });

  } catch (error) {
    console.error('Error en actualizarPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// ── Actualizar foto de perfil ────────────────────────────────────────────────
const actualizarFotoPerfil = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir una imagen'
      });
    }

    const nueva_foto = req.file.path;

    const [clienteActual, clienteActualizado] = await Promise.all([
      Cliente.buscarPorId(id_cliente),
      Cliente.actualizarFotoPerfil(id_cliente, nueva_foto)
    ]);

    if (clienteActual?.foto_perfil?.includes('cloudinary')) {
      const publicId = extraerPublicId(clienteActual.foto_perfil);
      if (publicId) {
        eliminarImagen(publicId)
          .catch(err => console.error('Error al eliminar foto anterior de Cloudinary:', err));
      }
    }

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: { foto_perfil: nueva_foto }
    });

  } catch (error) {
    console.error('Error en actualizarFotoPerfil:', error);
    
    if (req.file?.path) {
      const publicId = extraerPublicId(req.file.path);
      if (publicId) {
        eliminarImagen(publicId)
          .catch(err => console.error('Error al eliminar imagen tras fallo:', err));
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar foto de perfil',
      error: error.message
    });
  }
};

// ── Solicitar recuperación de contraseña ─────────────────────────────────────
const solicitarRecuperacion = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ success: false, message: 'Correo requerido' });

  try {
    await admin.auth().getUserByEmail(correo);
    await emailService.enviarRecuperacion({ email: correo });
  } catch (e) {
    // No revelar si existe o no por seguridad
  }

  res.json({ success: true, message: 'Si el correo existe, recibirás el enlace' });
};

// ── Eliminar foto de perfil ──────────────────────────────────────────────────
const eliminarFotoPerfil = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    const clienteActual = await Cliente.buscarPorId(id_cliente);

    if (!clienteActual.foto_perfil) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una foto de perfil para eliminar'
      });
    }

    const promesas = [Cliente.actualizarFotoPerfil(id_cliente, null)];

    if (clienteActual.foto_perfil.includes('cloudinary')) {
      const publicId = extraerPublicId(clienteActual.foto_perfil);
      if (publicId) {
        promesas.push(
          eliminarImagen(publicId).catch(err =>
            console.error('Error al eliminar de Cloudinary:', err)
          )
        );
      }
    }

    await Promise.all(promesas);

    res.json({
      success: true,
      message: 'Foto de perfil eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarFotoPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar foto de perfil',
      error: error.message
    });
  }
};

module.exports = {
  registrarCliente,
  loginCliente,
  obtenerPerfil,
  actualizarPerfil,
  actualizarFotoPerfil,
  eliminarFotoPerfil,
  solicitarRecuperacion
};