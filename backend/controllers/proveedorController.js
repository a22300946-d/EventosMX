const emailService = require('../services/emailService');
const admin = require('../config/firebase.config');
const Proveedor = require('../models/Proveedor');
const { generarToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');
const { eliminarImagen, extraerPublicId } = require('../config/cloudinary');

const registrarProveedor = async (req, res) => {
  try {
    const {
      nombre_negocio, correo, contrasena, telefono,
      ciudad, tipo_servicio, descripcion
    } = req.body;

    if (!nombre_negocio || !correo || !contrasena || !tipo_servicio) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del negocio, correo, contraseña y tipo de servicio son obligatorios'
      });
    }

    const proveedorExistente = await Proveedor.buscarPorCorreo(correo);
    if (proveedorExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // 1) Primero Firebase — si falla, no se toca la BD
    const firebaseUser = await admin.auth().createUser({
      email: correo,
      password: contrasena,
      displayName: nombre_negocio,
      emailVerified: false
    });

    // 2) Luego BD — si falla, hacemos rollback en Firebase
    let nuevoProveedor;
    try {
      nuevoProveedor = await Proveedor.crear({
        nombre_negocio, correo, contrasena, telefono,
        ciudad, tipo_servicio, descripcion
      });
    } catch (dbError) {
      await admin.auth().deleteUser(firebaseUser.uid).catch(() => {});
      throw dbError;
    }

    emailService.enviarVerificacion({ email: correo, nombre: nombre_negocio })
      .catch(err => console.error('Error al enviar verificación (no crítico):', err));

    try {
      const { getIO } = require('../config/socket');
      const io = getIO();
      if (io) {
        io.emit('admin_nueva_solicitud_proveedor', {
          tipo: 'nuevo_proveedor',
          id_proveedor: nuevoProveedor.id_proveedor,
          nombre_negocio: nuevoProveedor.nombre_negocio,
          correo: nuevoProveedor.correo,
          telefono: nuevoProveedor.telefono || null,
          ciudad: nuevoProveedor.ciudad || null,
          tipo_servicio: nuevoProveedor.tipo_servicio,
          fecha_registro: nuevoProveedor.fecha_registro,
        });
      }
    } catch (socketError) {
      console.error('Error al emitir socket de nuevo proveedor:', socketError);
    }

    const token = generarToken({
      id: nuevoProveedor.id_proveedor,
      correo: nuevoProveedor.correo,
      rol: 'proveedor'
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente. Pendiente de aprobación.',
      data: { proveedor: nuevoProveedor, token }
    });

  } catch (error) {
    console.error('Error en registrarProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar proveedor',
      error: error.message
    });
  }
};

// Login de proveedor
const loginProveedor = async (req, res) => {
  try {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Correo y contraseña son obligatorios'
      });
    }

    const proveedor = await Proveedor.buscarPorCorreo(correo);
    if (!proveedor) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    if (proveedor.estado_cuenta === 'bloqueado') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta bloqueada. Contacta al administrador.'
      });
    }

    // Verificar contraseña — el login de proveedor no requiere verificar Firebase
    // porque los proveedores son aprobados manualmente por el admin
    const contrasenaValida = await Proveedor.verificarContrasena(contrasena, proveedor.contrasena);
    
    if (!contrasenaValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const token = generarToken({
      id: proveedor.id_proveedor,
      correo: proveedor.correo,
      rol: 'proveedor'
    });

    delete proveedor.contrasena;

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        proveedor,
        token
      }
    });

  } catch (error) {
    console.error('Error en loginProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener perfil del proveedor autenticado
const obtenerPerfil = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const proveedor = await Proveedor.buscarPorId(id_proveedor);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    res.json({
      success: true,
      data: proveedor
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

// Actualizar perfil del proveedor
const actualizarPerfil = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { 
      nombre_negocio, telefono, ciudad, tipo_servicio, 
      descripcion, nueva_contrasena
    } = req.body;

    const datosActualizar = {};

    if (nombre_negocio !== undefined) datosActualizar.nombre_negocio = nombre_negocio;
    if (telefono !== undefined) datosActualizar.telefono = telefono;
    if (ciudad !== undefined) datosActualizar.ciudad = ciudad;
    if (tipo_servicio !== undefined) datosActualizar.tipo_servicio = tipo_servicio;
    if (descripcion !== undefined) datosActualizar.descripcion = descripcion;

    if (nueva_contrasena) {
      const salt = await bcrypt.genSalt(10);
      datosActualizar.contrasena = await bcrypt.hash(nueva_contrasena, salt);
    }

    const proveedorActualizado = await Proveedor.actualizarPerfil(id_proveedor, datosActualizar);

    if (!proveedorActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    delete proveedorActualizado.contrasena;

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: proveedorActualizado
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
    const id_proveedor = req.usuario.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Debes subir una imagen'
      });
    }

    const nueva_foto = req.file.path;

    // Obtener foto anterior y actualizar en paralelo
    const [proveedorActual, proveedorActualizado] = await Promise.all([
      Proveedor.buscarPorId(id_proveedor),
      Proveedor.actualizarFotoPerfil(id_proveedor, nueva_foto)
    ]);

    // Eliminar logo anterior de Cloudinary sin bloquear la respuesta
    if (proveedorActual?.logo?.includes('cloudinary')) {
      const publicId = extraerPublicId(proveedorActual.logo);
      if (publicId) {
        eliminarImagen(publicId)
          .catch(err => console.error('Error al eliminar foto anterior de Cloudinary:', err));
      }
    }

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      data: { logo: nueva_foto }
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

// Buscar proveedores (público)
const buscarProveedores = async (req, res) => {
  try {
    const { ciudad, tipo_servicio, nombre_proveedor, calificacion_min, limite } = req.query;

    const proveedores = await Proveedor.buscarConFiltros({
      ciudad,
      tipo_servicio,
      nombre_proveedor,
      calificacion_min: calificacion_min ? parseFloat(calificacion_min) : null,
      limite: limite ? parseInt(limite) : 20
    });

    res.json({
      success: true,
      data: proveedores,
      total: proveedores.length
    });

  } catch (error) {
    console.error('Error en buscarProveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar proveedores',
      error: error.message
    });
  }
};

// Obtener proveedor por ID (público)
const obtenerProveedorPublico = async (req, res) => {
  try {
    const { id } = req.params;

    const proveedor = await Proveedor.buscarPorId(id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    if (proveedor.estado_aprobacion !== 'aprobado') {
      return res.status(403).json({
        success: false,
        message: 'Proveedor no disponible'
      });
    }

    res.json({
      success: true,
      data: proveedor
    });

  } catch (error) {
    console.error('Error en obtenerProveedorPublico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
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
    const id_proveedor = req.usuario.id;

    const proveedorActual = await Proveedor.buscarPorId(id_proveedor);

    if (!proveedorActual.logo) {
      return res.status(400).json({
        success: false,
        message: 'No tienes una foto de perfil para eliminar'
      });
    }

    // Eliminar de Cloudinary y BD en paralelo
    const promesas = [Proveedor.actualizarFotoPerfil(id_proveedor, null)];

    if (proveedorActual.logo.includes('cloudinary')) {
      const publicId = extraerPublicId(proveedorActual.logo);
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
  registrarProveedor,
  loginProveedor,
  obtenerPerfil,
  actualizarPerfil,
  actualizarFotoPerfil,
  eliminarFotoPerfil,
  buscarProveedores,
  obtenerProveedorPublico,
  solicitarRecuperacion
};