const Proveedor = require('../models/Proveedor');
const { generarToken } = require('../utils/jwt');

// Registro de proveedor
const registrarProveedor = async (req, res) => {
  try {
    const { 
      nombre_negocio, correo, contrasena, telefono, 
      ciudad, tipo_servicio, descripcion 
    } = req.body;

    // Validar campos requeridos
    if (!nombre_negocio || !correo || !contrasena || !tipo_servicio) {
      return res.status(400).json({
        success: false,
        message: 'Nombre del negocio, correo, contraseña y tipo de servicio son obligatorios'
      });
    }

    // Verificar si el correo ya existe
    const proveedorExistente = await Proveedor.buscarPorCorreo(correo);
    if (proveedorExistente) {
      return res.status(400).json({
        success: false,
        message: 'El correo ya está registrado'
      });
    }

    // Crear proveedor
    const nuevoProveedor = await Proveedor.crear({
      nombre_negocio,
      correo,
      contrasena,
      telefono,
      ciudad,
      tipo_servicio,
      descripcion
    });

    // Generar token
    const token = generarToken({
      id: nuevoProveedor.id_proveedor,
      correo: nuevoProveedor.correo,
      rol: 'proveedor'
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente. Pendiente de aprobación.',
      data: {
        proveedor: nuevoProveedor,
        token
      }
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
      descripcion, logo 
    } = req.body;

    const proveedorActualizado = await Proveedor.actualizarPerfil(id_proveedor, {
      nombre_negocio,
      telefono,
      ciudad,
      tipo_servicio,
      descripcion,
      logo
    });

    if (!proveedorActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

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

module.exports = {
  registrarProveedor,
  loginProveedor,
  obtenerPerfil,
  actualizarPerfil,
  buscarProveedores,
  obtenerProveedorPublico
};