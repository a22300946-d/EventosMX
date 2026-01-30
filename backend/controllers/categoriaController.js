const pool = require('../config/database');

// Obtener todas las categorías activas
const obtenerCategorias = async (req, res) => {
  try {
    const query = `
      SELECT id_categoria, nombre_categoria, descripcion, icono
      FROM Categoria
      WHERE activo = true
      ORDER BY nombre_categoria ASC
    `;
    
    const resultado = await pool.query(query);

    res.json({
      success: true,
      data: resultado.rows,
      total: resultado.rows.length
    });

  } catch (error) {
    console.error('Error en obtenerCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

// Obtener una categoría por ID
const obtenerCategoriaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'SELECT * FROM Categoria WHERE id_categoria = $1 AND activo = true';
    const resultado = await pool.query(query, [id]);

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error en obtenerCategoriaPorId:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

// Crear nueva categoría (solo admin)
const crearCategoria = async (req, res) => {
  try {
    const { nombre_categoria, descripcion, icono } = req.body;

    if (!nombre_categoria) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es obligatorio'
      });
    }

    const query = `
      INSERT INTO Categoria (nombre_categoria, descripcion, icono)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const valores = [nombre_categoria, descripcion, icono];
    const resultado = await pool.query(query, valores);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: resultado.rows[0]
    });

  } catch (error) {
    console.error('Error en crearCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

module.exports = {
  obtenerCategorias,
  obtenerCategoriaPorId,
  crearCategoria
};