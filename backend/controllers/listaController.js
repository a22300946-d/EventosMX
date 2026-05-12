const Lista = require('../models/Lista');
const pool = require('../config/database');

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

// Actualizar lista (renombrar) - VERSIÓN ÚNICA Y COMPLETA
const actualizarLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params;
    const { nombre_lista, descripcion } = req.body;

    console.log('Actualizando lista:', { id, nombre_lista, descripcion, id_cliente });

    // Validar datos
    if (!nombre_lista || nombre_lista.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la lista debe tener al menos 3 caracteres',
      });
    }

    if (nombre_lista.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'El nombre no puede exceder 100 caracteres',
      });
    }

    // Evitar renombrar a "Favoritos"
    if (nombre_lista.trim().toLowerCase() === 'favoritos') {
      return res.status(400).json({
        success: false,
        message: 'El nombre "Favoritos" está reservado para el sistema',
      });
    }

    // Verificar que la lista pertenece al cliente
    const lista = await Lista.obtenerPorId(id, id_cliente);
    
    if (!lista) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada',
      });
    }

    // Evitar renombrar la lista de Favoritos
    if (lista.nombre_lista === 'Favoritos') {
      return res.status(400).json({
        success: false,
        message: 'No se puede renombrar la lista de Favoritos',
      });
    }

    // Actualizar la lista
    const listaActualizada = await Lista.actualizar(id, id_cliente, {
      nombre_lista: nombre_lista.trim(),
      descripcion: descripcion?.trim() || null,
    });

    res.json({
      success: true,
      message: 'Lista actualizada correctamente',
      data: listaActualizada,
    });

  } catch (error) {
    console.error('Error en actualizarLista:', error);

    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una lista con ese nombre',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar la lista',
      error: error.message,
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

// Agregar proveedor a una lista
const agregarProveedorALista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params; // id_lista
    const { id_proveedor } = req.body;

    console.log('Agregar proveedor a lista:', {
      id_lista: id,
      id_proveedor,
      id_cliente
    });

    // Validar datos
    if (!id_proveedor) {
      return res.status(400).json({
        success: false,
        message: 'El id_proveedor es obligatorio',
      });
    }

    // Verificar que la lista pertenece al cliente
    const lista = await Lista.obtenerPorId(id, id_cliente);
    
    if (!lista) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada',
      });
    }

    // Agregar el proveedor a la lista
    const proveedorAgregado = await Lista.agregarProveedor(
      id,
      id_proveedor,
      id_cliente,
      null // notas
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor agregado a la lista',
      data: proveedorAgregado,
    });

  } catch (error) {
    console.error('Error en agregarProveedorALista:', error);

    if (error.code === '23503') {
      return res.status(404).json({
        success: false,
        message: 'El proveedor no existe',
      });
    }

    if (error.message === 'El proveedor ya está en esta lista') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al agregar proveedor a la lista',
      error: error.message,
    });
  }
};

// Cambiar estado del proveedor en la lista
const cambiarEstadoProveedor = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params; // id_lista_proveedor
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['Pendiente', 'Adquirido'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Debe ser: Pendiente o Adquirido'
      });
    }

    const proveedorActualizado = await Lista.actualizarEstadoProveedor(
      id,
      id_cliente,
      estado
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
    console.error('Error en cambiarEstadoProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Eliminar proveedor de una lista
const eliminarProveedorDeLista = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params; // id_lista_proveedor

    const proveedorEliminado = await Lista.eliminarProveedorDeLista(
      id,
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
    console.error('Error en eliminarProveedorDeLista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

// ========== CONTROLADORES DE FAVORITOS ==========

// Obtener lista de Favoritos
const obtenerListaFavoritos = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;

    // Obtener o crear la lista de favoritos
    const listaFavoritos = await Lista.obtenerOCrearListaFavoritos(id_cliente);

    // Obtener los proveedores de la lista
    const proveedores = await Lista.obtenerProveedoresDeLista(
      listaFavoritos.id_lista,
      id_cliente
    );

    res.json({
      success: true,
      data: {
        lista: listaFavoritos,
        proveedores: proveedores || [],
      },
    });
  } catch (error) {
    console.error('Error en obtenerListaFavoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos',
      error: error.message,
    });
  }
};

// Agregar proveedor a Favoritos
const agregarProveedorAFavoritos = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_proveedor } = req.body;

    if (!id_proveedor) {
      return res.status(400).json({
        success: false,
        message: 'El id_proveedor es obligatorio',
      });
    }

    // Obtener o crear la lista de favoritos
    const listaFavoritos = await Lista.obtenerOCrearListaFavoritos(id_cliente);

    // Verificar si ya está en favoritos
    const yaExiste = await Lista.verificarProveedorEnFavoritos(
      id_cliente,
      id_proveedor
    );

    if (yaExiste) {
      return res.status(409).json({
        success: false,
        message: 'Este proveedor ya está en favoritos',
      });
    }

    // Agregar el proveedor a la lista
    const proveedorAgregado = await Lista.agregarProveedor(
      listaFavoritos.id_lista,
      id_proveedor,
      id_cliente,
      null
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor agregado a favoritos',
      data: proveedorAgregado,
    });
  } catch (error) {
    console.error('Error en agregarProveedorAFavoritos:', error);

    if (error.code === '23503') {
      return res.status(404).json({
        success: false,
        message: 'El proveedor no existe',
      });
    }

    if (error.message === 'El proveedor ya está en esta lista') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al agregar a favoritos',
      error: error.message,
    });
  }
};

// Eliminar proveedor de Favoritos
const eliminarProveedorDeFavoritos = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id } = req.params; // id_lista_proveedor

    // Verificar que pertenece a la lista de favoritos del cliente
    const query = `
      SELECT lp.id_lista_proveedor
      FROM ListaProveedor lp
      INNER JOIN Lista l ON lp.id_lista = l.id_lista
      WHERE lp.id_lista_proveedor = $1
        AND l.id_cliente = $2
        AND l.nombre_lista = 'Favoritos'
    `;

    const resultado = await pool.query(query, [id, id_cliente]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorito no encontrado',
      });
    }

    // Eliminar usando el método del modelo
    await Lista.eliminarProveedorDeLista(id, id_cliente);

    res.json({
      success: true,
      message: 'Proveedor eliminado de favoritos',
    });
  } catch (error) {
    console.error('Error en eliminarProveedorDeFavoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar de favoritos',
      error: error.message,
    });
  }
};

// Verificar si un proveedor está en favoritos
const verificarProveedorEnFavoritos = async (req, res) => {
  try {
    const id_cliente = req.usuario.id;
    const { id_proveedor } = req.params;

    const favorito = await Lista.verificarProveedorEnFavoritos(
      id_cliente,
      id_proveedor
    );

    res.json({
      success: true,
      data: {
        es_favorito: !!favorito,
        id_lista_proveedor: favorito?.id_lista_proveedor || null,
      },
    });
  } catch (error) {
    console.error('Error en verificarProveedorEnFavoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito',
      error: error.message,
    });
  }
};

// ========== EXPORTACIONES ==========
module.exports = {
  crearLista,
  obtenerMisListas,
  obtenerListaPorId,
  actualizarLista,
  eliminarLista,
  agregarProveedorALista,
  cambiarEstadoProveedor,
  eliminarProveedorDeLista,
  obtenerListaFavoritos,
  agregarProveedorAFavoritos,
  eliminarProveedorDeFavoritos,
  verificarProveedorEnFavoritos
};