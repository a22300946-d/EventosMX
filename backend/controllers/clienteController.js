const emailService = require('../services/emailService');
const admin = require('../config/firebase.config');
const Cliente = require('../models/Cliente');
const { generarToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const { eliminarImagen, extraerPublicId } = require('../config/cloudinary');

// Registro de cliente
const registrarCliente = async (req, res) => {
  try {
    const { nombre_completo, correo, contrasena, telefono, ciudad } = req.body;

    // Validar campos requeridos
    if (!nombre_completo || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Nombre completo, correo y contraseña son obligatorios'
      });
    }

    // Verificar si el correo ya existe
    const clienteExistente = await Cliente.buscarPorCorreo(correo);
    if (clienteExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Crear cliente en BD y en Firebase en paralelo para reducir tiempo de espera
    const [nuevoCliente, firebaseUser] = await Promise.all([
      Cliente.crear({ nombre_completo, correo, contrasena, telefono, ciudad }),
      admin.auth().createUser({
        email: correo,
        password: contrasena,
        displayName: nombre_completo,
        emailVerified: false
      })
    ]);

    // Enviar verificación sin bloquear la respuesta — el usuario ya está creado
    emailService.enviarVerificacion({ email: correo, nombre: nombre_completo })
      .catch(err => console.error('Error al enviar verificación (no crítico):', err));

    // Generar token
    const token = generarToken({
      id: nuevoCliente.id_cliente,
      correo: nuevoCliente.correo,
      rol: 'cliente'
    });

    res.status(201).json({
      success: true,
      message: 'Cliente registrado exitosamente',
      data: {
        cliente: nuevoCliente,
        token
      }
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

// Login de cliente
const loginCliente = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    // Validar campos
    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    // Buscar cliente
    const cliente = await Cliente.buscarPorCorreo(correo);
    if (!cliente) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Verificar si la cuenta está bloqueada
    if (cliente.estado_cuenta === 'bloqueado') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta bloqueada. Contacta al administrador.'
      });
    }

    // Verificar contraseña y estado Firebase en paralelo para reducir latencia
    const [contrasenaValida, firebaseUser] = await Promise.all([
      Cliente.verificarContrasena(contrasena, cliente.contrasena),
      admin.auth().getUserByEmail(correo).catch(err => {
        console.error('Error al verificar Firebase (no crítico):', err);
        return null; // Si Firebase falla, no bloqueamos el login
      })
    ]);

    if (!contrasenaValida) {
      // Incrementar intentos fallidos sin bloquear la respuesta
      Cliente.incrementarIntentosFallidos(cliente.id_cliente)
        .catch(err => console.error('Error al incrementar intentos:', err));

      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Verificar email en Firebase (solo si obtuvimos respuesta)
    if (firebaseUser && !firebaseUser.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
        emailVerified: false
      });
    }

    // Resetear intentos fallidos sin bloquear la respuesta
    Cliente.resetearIntentosFallidos(cliente.id_cliente)
      .catch(err => console.error('Error al resetear intentos:', err));

    // Generar token
    const token = generarToken({
      id: cliente.id_cliente,
      correo: cliente.correo,
      rol: 'cliente'
    });

    // No enviar la contraseña en la respuesta
    delete cliente.contrasena;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        cliente,
        token
      }
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

// Obtener perfil del cliente autenticado
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

    res.json({
      success: true,
      data: cliente
    });

  } catch (error) {
    console.error('Error en obtenerPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// Actualizar perfil del cliente
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

// Actualizar foto de perfil
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

    // Obtener foto anterior y actualizar en paralelo
    const [clienteActual, clienteActualizado] = await Promise.all([
      Cliente.buscarPorId(id_cliente),
      Cliente.actualizarFotoPerfil(id_cliente, nueva_foto)
    ]);

    // Eliminar foto anterior de Cloudinary sin bloquear la respuesta
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

    // Eliminar de Cloudinary y BD en paralelo
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