const pool = require('../config/database');

class Servicio {
  
  // Crear un nuevo servicio
  static async crear(datos) {
    const { 
      id_proveedor, id_categoria, nombre_servicio, 
      descripcion, precio, tipo_precio 
    } = datos;
    
    const query = `
      INSERT INTO Servicio 
      (id_proveedor, id_categoria, nombre_servicio, descripcion, precio, tipo_precio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const valores = [id_proveedor, id_categoria, nombre_servicio, descripcion, precio, tipo_precio];
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Obtener todos los servicios de un proveedor
  static async obtenerPorProveedor(id_proveedor) {
    const query = `
      SELECT s.*, c.nombre_categoria, c.icono
      FROM Servicio s
      INNER JOIN Categoria c ON s.id_categoria = c.id_categoria
      WHERE s.id_proveedor = $1
      ORDER BY s.fecha_creacion DESC
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows;
  }

  // Obtener un servicio por ID
  static async obtenerPorId(id_servicio) {
    const query = `
      SELECT s.*, c.nombre_categoria, c.icono,
             p.nombre_negocio, p.ciudad, p.telefono, p.calificacion_promedio
      FROM Servicio s
      INNER JOIN Categoria c ON s.id_categoria = c.id_categoria
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.id_servicio = $1
    `;
    
    const resultado = await pool.query(query, [id_servicio]);
    return resultado.rows[0];
  }

  // Buscar servicios con filtros
  static async buscarConFiltros(filtros = {}) {
    let query = `
      SELECT s.*, c.nombre_categoria, c.icono,
             p.nombre_negocio, p.ciudad, p.calificacion_promedio, p.logo
      FROM Servicio s
      INNER JOIN Categoria c ON s.id_categoria = c.id_categoria
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.disponible = true 
      AND p.estado_aprobacion = 'aprobado' 
      AND p.estado_cuenta = 'activo'
    `;
    
    const valores = [];
    let contador = 1;

    if (filtros.id_categoria) {
      query += ` AND s.id_categoria = $${contador}`;
      valores.push(filtros.id_categoria);
      contador++;
    }

    if (filtros.ciudad) {
      query += ` AND p.ciudad ILIKE $${contador}`;
      valores.push(`%${filtros.ciudad}%`);
      contador++;
    }

    if (filtros.precio_min) {
      query += ` AND s.precio >= $${contador}`;
      valores.push(filtros.precio_min);
      contador++;
    }

    if (filtros.precio_max) {
      query += ` AND s.precio <= $${contador}`;
      valores.push(filtros.precio_max);
      contador++;
    }

    if (filtros.busqueda) {
      query += ` AND (s.nombre_servicio ILIKE $${contador} OR s.descripcion ILIKE $${contador})`;
      valores.push(`%${filtros.busqueda}%`);
      contador++;
    }

    // Ordenar por calificación del proveedor
    query += ` ORDER BY p.calificacion_promedio DESC, s.fecha_creacion DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Actualizar un servicio
  static async actualizar(id_servicio, id_proveedor, datos) {
    const { 
      id_categoria, nombre_servicio, descripcion, 
      precio, tipo_precio, disponible 
    } = datos;
    
    const query = `
      UPDATE Servicio 
      SET id_categoria = COALESCE($1, id_categoria),
          nombre_servicio = COALESCE($2, nombre_servicio),
          descripcion = COALESCE($3, descripcion),
          precio = COALESCE($4, precio),
          tipo_precio = COALESCE($5, tipo_precio),
          disponible = COALESCE($6, disponible),
          fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_servicio = $7 AND id_proveedor = $8
      RETURNING *
    `;
    
    const valores = [
      id_categoria, nombre_servicio, descripcion, 
      precio, tipo_precio, disponible, 
      id_servicio, id_proveedor
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Eliminar un servicio
  static async eliminar(id_servicio, id_proveedor) {
    const query = `
      DELETE FROM Servicio 
      WHERE id_servicio = $1 AND id_proveedor = $2
      RETURNING id_servicio
    `;
    
    const resultado = await pool.query(query, [id_servicio, id_proveedor]);
    return resultado.rows[0];
  }

  // Obtener servicios por categoría
  static async obtenerPorCategoria(id_categoria, limite = 20) {
    const query = `
      SELECT s.*, p.nombre_negocio, p.ciudad, p.calificacion_promedio, p.logo
      FROM Servicio s
      INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
      WHERE s.id_categoria = $1 
      AND s.disponible = true
      AND p.estado_aprobacion = 'aprobado'
      ORDER BY p.calificacion_promedio DESC
      LIMIT $2
    `;
    
    const resultado = await pool.query(query, [id_categoria, limite]);
    return resultado.rows;
  }
}

module.exports = Servicio;