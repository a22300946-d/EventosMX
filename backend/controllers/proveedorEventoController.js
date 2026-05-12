const ProveedorEvento = require('../models/ProveedorEvento');
const pool = require('../config/database'); // ✅ Agregar para la búsqueda

// Obtener todos los tipos de eventos disponibles
const obtenerTiposEventos = async (req, res) => {
  try {
    const tiposEventos = await ProveedorEvento.obtenerTiposEventos();

    res.json({
      success: true,
      data: tiposEventos,
    });
  } catch (error) {
    console.error('Error en obtenerTiposEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de eventos',
      error: error.message,
    });
  }
};

// Obtener eventos de un proveedor específico
const obtenerEventosDeProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;

    const eventos = await ProveedorEvento.obtenerEventosDeProveedor(id_proveedor);

    res.json({
      success: true,
      data: eventos,
    });
  } catch (error) {
    console.error('Error en obtenerEventosDeProveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener eventos del proveedor',
      error: error.message,
    });
  }
};

// Obtener MIS eventos (proveedor autenticado)
const obtenerMisEventos = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;

    const eventos = await ProveedorEvento.obtenerEventosDeProveedor(id_proveedor);

    res.json({
      success: true,
      data: eventos,
    });
  } catch (error) {
    console.error('Error en obtenerMisEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mis eventos',
      error: error.message,
    });
  }
};

// Agregar evento a mi perfil
const agregarEvento = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id_tipo_evento } = req.body;

    if (!id_tipo_evento) {
      return res.status(400).json({
        success: false,
        message: 'El id_tipo_evento es obligatorio',
      });
    }

    const eventoAgregado = await ProveedorEvento.agregarEventoAProveedor(
      id_proveedor,
      id_tipo_evento
    );

    res.status(201).json({
      success: true,
      message: 'Tipo de evento agregado exitosamente',
      data: eventoAgregado,
    });
  } catch (error) {
    console.error('Error en agregarEvento:', error);

    if (error.message === 'Este tipo de evento ya está agregado') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al agregar tipo de evento',
      error: error.message,
    });
  }
};

// Eliminar evento de mi perfil
const eliminarEvento = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { id_tipo_evento } = req.params;

    const eventoEliminado = await ProveedorEvento.eliminarEventoDeProveedor(
      id_proveedor,
      id_tipo_evento
    );

    if (!eventoEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de evento no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Tipo de evento eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error en eliminarEvento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tipo de evento',
      error: error.message,
    });
  }
};

// Actualizar todos mis eventos (reemplazar)
const actualizarMisEventos = async (req, res) => {
  try {
    const id_proveedor = req.usuario.id;
    const { ids_tipos_eventos } = req.body;

    if (!Array.isArray(ids_tipos_eventos)) {
      return res.status(400).json({
        success: false,
        message: 'ids_tipos_eventos debe ser un array',
      });
    }

    const eventosActualizados = await ProveedorEvento.actualizarEventosDeProveedor(
      id_proveedor,
      ids_tipos_eventos
    );

    res.json({
      success: true,
      message: 'Tipos de eventos actualizados exitosamente',
      data: eventosActualizados,
    });
  } catch (error) {
    console.error('Error en actualizarMisEventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tipos de eventos',
      error: error.message,
    });
  }
};

// ✅ NUEVA FUNCIÓN: Buscar proveedores por tipo de evento
const obtenerProveedoresPorTipoEvento = async (req, res) => {
  try {
    const { nombre_evento } = req.query;

    if (!nombre_evento) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro nombre_evento es requerido'
      });
    }

    console.log(`🔍 Buscando proveedores con evento: ${nombre_evento}`);

    // ✅ QUERY SIMPLIFICADO: Sin filtros de activo/aprobado (no existen)
    const query = `
      SELECT DISTINCT
        pe.id_proveedor,
        p.nombre_negocio,
        p.correo,
        p.telefono,
        p.ciudad,
        p.descripcion,
        p.logo,
        p.tipo_servicio,
        p.calificacion_promedio,
        te.nombre_evento,
        te.activo as evento_activo
      FROM ProveedorEvento pe
      INNER JOIN Proveedor p ON pe.id_proveedor = p.id_proveedor
      INNER JOIN TipoEvento te ON pe.id_tipo_evento = te.id_tipo_evento
      WHERE te.nombre_evento ILIKE $1
        AND te.activo = true
      ORDER BY p.calificacion_promedio DESC NULLS LAST
    `;

    const result = await pool.query(query, [`%${nombre_evento}%`]);

    console.log(`✅ Proveedores encontrados: ${result.rows.length}`);

    res.status(200).json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      message: `${result.rows.length} proveedores encontrados con el evento ${nombre_evento}`
    });

  } catch (error) {
    console.error('❌ Error al buscar proveedores por tipo de evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar proveedores por tipo de evento',
      error: error.message
    });
  }
};

module.exports = {
  obtenerTiposEventos,
  obtenerEventosDeProveedor,
  obtenerMisEventos,
  agregarEvento,
  eliminarEvento,
  actualizarMisEventos,
  obtenerProveedoresPorTipoEvento, // ✅ AGREGAR
};