const emailService = require('../services/emailService');
const admin = require('../config/firebase.config');

const Cliente = require('../models/Cliente');
const { generarToken } = require('../utils/jwt');

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

    // Crear cliente
    const nuevoCliente = await Cliente.crear({
      nombre_completo,
      correo,
      contrasena,
      telefono,
      ciudad
    });

    // Crear en Firebase
const firebaseUser = await admin.auth().createUser({
  email: correo,
  password: contrasena,
  displayName: nombre_completo,
  emailVerified: false
});

// Enviar verificación
await emailService.enviarVerificacion({ email: correo, nombre: nombre_completo });

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
        message: 'Cuenta bloqueada por múltiples intentos fallidos. Contacta al administrador.'
      });
    }

    // Verificar contraseña
    const contrasenaValida = await Cliente.verificarContrasena(contrasena, cliente.contrasena);
    
    if (!contrasenaValida) {
      // Incrementar intentos fallidos
      await Cliente.incrementarIntentosFallidos(cliente.id_cliente);
      
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Resetear intentos fallidos
    await Cliente.resetearIntentosFallidos(cliente.id_cliente);


// ← NUEVO: Verificar si el correo fue verificado en Firebase
try {
  const firebaseUser = await admin.auth().getUserByEmail(correo);
  if (!firebaseUser.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
      emailVerified: false
    });
  }
} catch (firebaseError) {
  console.error('Error al verificar Firebase:', firebaseError);
}


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
    const { nombre_completo, telefono, ciudad, foto_perfil } = req.body;

    const clienteActualizado = await Cliente.actualizarPerfil(id_cliente, {
      nombre_completo,
      telefono,
      ciudad,
      foto_perfil
    });

    if (!clienteActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

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

const solicitarRecuperacion = async (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ success: false, message: 'Correo requerido' });

  try {
    await admin.auth().getUserByEmail(correo); // verifica que existe
    await emailService.enviarRecuperacion({ email: correo });
  } catch (e) {
    // No revelar si existe o no por seguridad
  }

  res.json({ success: true, message: 'Si el correo existe, recibirás el enlace' });
};

module.exports = {
  registrarCliente,
  loginCliente,
  obtenerPerfil,
  actualizarPerfil,
  solicitarRecuperacion
};

