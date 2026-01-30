const pool = require('../config/database');
const { LIMITES } = require('../config/constantes');

class Promocion {
  
  // Crear una nueva promoción
  static async crear(datos) {
    const { 
      id_proveedor, titulo, descripcion, precio_original, 
      precio_promocional, porcentaje_descuento, fecha_inicio, fecha_fin 
    } = datos;
    
    // Verificar límite de promociones activas
    const promocionesActivas = await this.contarPromocionesActivas(id_proveedor);
    if (promocionesActivas >= LIMITES.MAX_PROMOCIONES_ACTIVAS) {
      throw new Error(`LIMITE_EXCEDIDO:${LIMITES.MAX_PROMOCIONES_ACTIVAS}`);
    }
    
    const query = `
      INSERT INTO Promocion 
      (id_proveedor, titulo, descripcion, precio_original, precio_promocional, 
       porcentaje_descuento, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const valores = [
      id_proveedor, titulo, descripcion, precio_original, 
      precio_promocional, porcentaje_descuento, fecha_inicio, fecha_fin
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Contar promociones activas de un proveedor
  static async contarPromocionesActivas(id_proveedor) {
    const query = `
      SELECT COUNT(*) as total
      FROM Promocion
      WHERE id_proveedor = $1 
      AND activo = true
      AND fecha_fin >= CURRENT_DATE
    `;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return parseInt(resultado.rows[0].total);
  }

  // Obtener promociones de un proveedor
  static async obtenerPorProveedor(id_proveedor, soloActivas = false) {
    let query = `
      SELECT *
      FROM Promocion
      WHERE id_proveedor = $1
    `;
    
    if (soloActivas) {
      query += ` AND activo = true AND fecha_fin >= CURRENT_DATE`;
    }
    
    query += ` ORDER BY fecha_creacion DESC`;
    
    const resultado = await pool.query(query, [id_proveedor]);
    return resultado.rows;
  }

  // Obtener promoción por ID
  static async obtenerPorId(id_promocion) {
    const query = `
      SELECT p.*, 
             pr.nombre_negocio, pr.logo, pr.ciudad, pr.telefono
      FROM Promocion p
      INNER JOIN Proveedor pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.id_promocion = $1
    `;
    
    const resultado = await pool.query(query, [id_promocion]);
    return resultado.rows[0];
  }

  // Buscar promociones activas (público)
  static async buscarActivas(filtros = {}) {
    let query = `
      SELECT p.*, 
             pr.nombre_negocio, pr.logo, pr.ciudad, pr.calificacion_promedio
      FROM Promocion p
      INNER JOIN Proveedor pr ON p.id_proveedor = pr.id_proveedor
      WHERE p.activo = true 
      AND p.fecha_fin >= CURRENT_DATE
      AND pr.estado_aprobacion = 'aprobado'
      AND pr.estado_cuenta = 'activo'
    `;
    
    const valores = [];
    let contador = 1;

    if (filtros.ciudad) {
      query += ` AND pr.ciudad ILIKE $${contador}`;
      valores.push(`%${filtros.ciudad}%`);
      contador++;
    }

    if (filtros.precio_max) {
      query += ` AND p.precio_promocional <= $${contador}`;
      valores.push(filtros.precio_max);
      contador++;
    }

    if (filtros.porcentaje_min) {
      query += ` AND p.porcentaje_descuento >= $${contador}`;
      valores.push(filtros.porcentaje_min);
      contador++;
    }

    // Ordenar por porcentaje de descuento (mayor descuento primero)
    query += ` ORDER BY p.porcentaje_descuento DESC, p.fecha_creacion DESC`;

    if (filtros.limite) {
      query += ` LIMIT $${contador}`;
      valores.push(filtros.limite);
    }

    const resultado = await pool.query(query, valores);
    return resultado.rows;
  }

  // Actualizar promoción
  static async actualizar(id_promocion, id_proveedor, datos) {
    const { 
      titulo, descripcion, precio_original, precio_promocional,
      porcentaje_descuento, fecha_inicio, fecha_fin, activo 
    } = datos;
    
    const query = `
      UPDATE Promocion 
      SET titulo = COALESCE($1, titulo),
          descripcion = COALESCE($2, descripcion),
          precio_original = COALESCE($3, precio_original),
          precio_promocional = COALESCE($4, precio_promocional),
          porcentaje_descuento = COALESCE($5, porcentaje_descuento),
          fecha_inicio = COALESCE($6, fecha_inicio),
          fecha_fin = COALESCE($7, fecha_fin),
          activo = COALESCE($8, activo)
      WHERE id_promocion = $9 AND id_proveedor = $10
      RETURNING *
    `;
    
    const valores = [
      titulo, descripcion, precio_original, precio_promocional,
      porcentaje_descuento, fecha_inicio, fecha_fin, activo,
      id_promocion, id_proveedor
    ];
    
    const resultado = await pool.query(query, valores);
    return resultado.rows[0];
  }

  // Desactivar promoción
  static async desactivar(id_promocion, id_proveedor) {
    const query = `
      UPDATE Promocion 
      SET activo = false
      WHERE id_promocion = $1 AND id_proveedor = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_promocion, id_proveedor]);
    return resultado.rows[0];
  }

  // Eliminar promoción
  static async eliminar(id_promocion, id_proveedor) {
    const query = `
      DELETE FROM Promocion 
      WHERE id_promocion = $1 AND id_proveedor = $2
      RETURNING *
    `;
    
    const resultado = await pool.query(query, [id_promocion, id_proveedor]);
    return resultado.rows[0];
  }

  // Eliminar promociones expiradas (tarea automática)
  static async eliminarExpiradas() {
    const query = `
      UPDATE Promocion 
      SET activo = false
      WHERE fecha_fin < CURRENT_DATE 
      AND activo = true
      RETURNING *
    `;
    
    const resultado = await pool.query(query);
    return resultado.rows;
  }

  // Verificar si una promoción está vigente
  static async estaVigente(id_promocion) {
    const query = `
      SELECT *
      FROM Promocion
      WHERE id_promocion = $1
      AND activo = true
      AND fecha_inicio <= CURRENT_DATE
      AND fecha_fin >= CURRENT_DATE
    `;
    
    const resultado = await pool.query(query, [id_promocion]);
    return resultado.rows.length > 0;
  }

  // Obtener información del límite
  static async obtenerInfoLimite(id_proveedor) {
    const promocionesActivas = await this.contarPromocionesActivas(id_proveedor);
    
    return {
      promociones_activas: promocionesActivas,
      limite_maximo: LIMITES.MAX_PROMOCIONES_ACTIVAS,
      promociones_disponibles: LIMITES.MAX_PROMOCIONES_ACTIVAS - promocionesActivas,
      puede_agregar: promocionesActivas < LIMITES.MAX_PROMOCIONES_ACTIVAS
    };
  }
}

module.exports = Promocion;