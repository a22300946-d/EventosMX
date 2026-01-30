const Lista = require('../models/Lista');

// Crear nueva lista
const crearLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { nombre_lista, descripcion } = req.body;

    // Validar campos requeridos
    if (!nombre_lista) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la lista es obligatorio'
      });
    }

    const nuevaLista = await Lista.crear({
      id_cliente,
      nombre_lista,
      descripcion
    });

    res.status(201).json({
      success: true,
      message: 'Lista creada exitosamente',
      data: nuevaLista
    });

  } catch (error) {
    console.error('Error en crearLista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear lista',
      error: error.message
    });
  }
};

// Obtener todas mis listas
const obtenerMisListas = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    const listas = await Lista.obtenerPorCliente(id_cliente);

    res.json({
      success: true,
      data: listas,
      total: listas.length
    });

  } catch (error) {
    console.error('Error en obtenerMisListas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener listas',
      error: error.message
    });
  }
};

// Obtener una lista específica con sus proveedores
const obtenerListaPorId = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;

    const lista = await Lista.obtenerPorId(id, id_cliente);

    if (!lista) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    const proveedores = await Lista.obtenerProveedoresDeLista(id, id_cliente);
    const estadisticas = await Lista.obtenerEstadisticas(id, id_cliente);

    res.json({
      success: true,
      data: {
        lista,
        proveedores,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error en obtenerListaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener lista',
      error: error.message
    });
  }
};

// Actualizar lista
const actualizarLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;
    const { nombre_lista, descripcion } = req.body;

    const listaActualizada = await Lista.actualizar(id, id_cliente, {
      nombre_lista,
      descripcion
    });

    if (!listaActualizada) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Lista actualizada exitosamente',
      data: listaActualizada
    });

  } catch (error) {
    console.error('Error en actualizarLista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar lista',
      error: error.message
    });
  }
};

// Eliminar lista
const eliminarLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;

    const listaEliminada = await Lista.eliminar(id, id_cliente);

    if (!listaEliminada) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Lista eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarLista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar lista',
      error: error.message
    });
  }
};

// Agregar proveedor a la lista
const agregarProveedor = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;
    const { id_proveedor, notas } = req.body;

    if (!id_proveedor) {
      return res.status(400).json({
        success: false,
        message: 'El ID del proveedor es obligatorio'
      });
    }

    try {
      const proveedorAgregado = await Lista.agregarProveedor(
        id,
        id_proveedor,
        id_cliente,
        notas
      );

      res.status(201).json({
        success: true,
        message: 'Proveedor agregado a la lista exitosamente',
        data: proveedorAgregado
      });

    } catch (error) {
      if (error.message.includes('ya está en esta lista')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }

  } catch (error) {
    console.error('Error en agregarProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar proveedor',
      error: error.message
    });
  }
};

// Actualizar estado del proveedor en la lista
const actualizarEstadoProveedor = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_lista_proveedor } = req.params;
    const { estado, notas } = req.body;

    // Validar estado
    const estadosValidos = ['Pendiente', 'Adquirido'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: Pendiente o Adquirido'
      });
    }

    const proveedorActualizado = await Lista.actualizarEstadoProveedor(
      id_lista_proveedor,
      id_cliente,
      estado,
      notas
    );

    if (!proveedorActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado en la lista'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: proveedorActualizado
    });

  } catch (error) {
    console.error('Error en actualizarEstadoProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Actualizar notas del proveedor
const actualizarNotasProveedor = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_lista_proveedor } = req.params;
    const { notas } = req.body;

    const proveedorActualizado = await Lista.actualizarNotasProveedor(
      id_lista_proveedor,
      id_cliente,
      notas
    );

    if (!proveedorActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado en la lista'
      });
    }

    res.json({
      success: true,
      message: 'Notas actualizadas exitosamente',
      data: proveedorActualizado
    });

  } catch (error) {
    console.error('Error en actualizarNotasProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar notas',
      error: error.message
    });
  }
};

// Eliminar proveedor de la lista
const eliminarProveedor = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_lista_proveedor } = req.params;

    const proveedorEliminado = await Lista.eliminarProveedor(
      id_lista_proveedor,
      id_cliente
    );

    if (!proveedorEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado en la lista'
      });
    }

    res.json({
      success: true,
      message: 'Proveedor eliminado de la lista exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

// Duplicar lista
const duplicarLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;
    const { nuevo_nombre } = req.body;

    if (!nuevo_nombre) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar un nombre para la nueva lista'
      });
    }

    const listaDuplicada = await Lista.duplicar(id, id_cliente, nuevo_nombre);

    if (!listaDuplicada) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Lista duplicada exitosamente',
      data: listaDuplicada
    });

  } catch (error) {
    console.error('Error en duplicarLista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al duplicar lista',
      error: error.message
    });
  }
};

module.exports = {
  crearLista,
  obtenerMisListas,
  obtenerListaPorId,
  actualizarLista,
  eliminarLista,
  agregarProveedor,
  actualizarEstadoProveedor,
  actualizarNotasProveedor,
  eliminarProveedor,
  duplicarLista
};