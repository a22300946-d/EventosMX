const pool = require('../config/database');

class RecomendacionService {
  
  // Pesos del algoritmo
  static PESOS = {
    DESCRIPCION: 0.15,
    SERVICIOS: 0.25,
    PRECIOS: 0.25,
    FOTOS: 0.10,
    UBICACION: 0.25
  };

  /**
   * Obtener proveedores recomendados para un cliente
   */
  static async obtenerRecomendaciones(id_cliente, limite = 20) {
    try {
      // 1. Obtener preferencias del cliente
      const preferencias = await this.obtenerPreferenciasCliente(id_cliente);
      
      if (!preferencias) {
        // Si no tiene preferencias, devolver proveedores mejor calificados
        return await this.obtenerProveedoresPopulares(limite);
      }

      // 2. Obtener todos los proveedores activos
      const proveedores = await this.obtenerProveedoresActivos();

      // 3. Calcular puntuación para cada proveedor
      const proveedoresConPuntuacion = await Promise.all(
        proveedores.map(async (proveedor) => {
          const puntuacion = await this.calcularPuntuacion(proveedor, preferencias);
          return {
            ...proveedor,
            //  Asegurar que calificacion_promedio sea número o null
            calificacion_promedio: proveedor.calificacion_promedio 
              ? parseFloat(proveedor.calificacion_promedio) 
              : null,
            puntuacion_recomendacion: puntuacion
          };
        })
      );

      // 4. Ordenar por puntuación descendente
      proveedoresConPuntuacion.sort((a, b) => b.puntuacion_recomendacion - a.puntuacion_recomendacion);

      // 5. Retornar los primeros N resultados
      return proveedoresConPuntuacion.slice(0, limite);

    } catch (error) {
      console.error('Error en obtenerRecomendaciones:', error);
      throw error;
    }
  }

  /**
   * Calcular puntuación de recomendación para un proveedor
   */
  static async calcularPuntuacion(proveedor, preferencias) {
    try {
      // Calcular cada componente
      const D = await this.calcularCoincidenciaDescripcion(proveedor, preferencias);
      const S = await this.calcularCoincidenciaServicios(proveedor, preferencias);
      const Pr = await this.calcularCoincidenciaPrecios(proveedor, preferencias);
      const F = await this.calcularPuntuacionFotos(proveedor);
      const U = await this.calcularCoincidenciaUbicacion(proveedor, preferencias);

      // Aplicar fórmula con pesos
      const puntuacion = 
        (this.PESOS.DESCRIPCION * D) +
        (this.PESOS.SERVICIOS * S) +
        (this.PESOS.PRECIOS * Pr) +
        (this.PESOS.FOTOS * F) +
        (this.PESOS.UBICACION * U);

      return Math.min(1, Math.max(0, puntuacion)); // Normalizar entre 0 y 1
    } catch (error) {
      console.error('Error en calcularPuntuacion:', error);
      return 0;
    }
  }

  /**
   * D: Coincidencia en descripción del negocio (0-1)
   */
  static calcularCoincidenciaDescripcion(proveedor, preferencias) {
    if (!proveedor.descripcion || !preferencias.servicios_preferidos) {
      return 0.5; // Valor neutral si no hay datos
    }

    const descripcion = proveedor.descripcion.toLowerCase();
    const servicios = Array.isArray(preferencias.servicios_preferidos) 
      ? preferencias.servicios_preferidos 
      : preferencias.servicios_preferidos.split(',');

    let coincidencias = 0;
    servicios.forEach(servicio => {
      if (descripcion.includes(servicio.toLowerCase().trim())) {
        coincidencias++;
      }
    });

    return servicios.length > 0 ? coincidencias / servicios.length : 0.5;
  }

  /**
   * S: Coincidencia de servicios/categoría (0-1)
   */
  static async calcularCoincidenciaServicios(proveedor, preferencias) {
    if (!preferencias.servicios_preferidos) {
      return 0.5;
    }

    const servicios = Array.isArray(preferencias.servicios_preferidos) 
      ? preferencias.servicios_preferidos 
      : preferencias.servicios_preferidos.split(',').map(s => s.trim());

    // Coincidencia exacta con tipo_servicio del proveedor
    if (servicios.includes(proveedor.tipo_servicio)) {
      return 1.0;
    }

    // Coincidencia parcial (si el tipo de servicio contiene alguna palabra clave)
    const tipoServicio = proveedor.tipo_servicio.toLowerCase();
    let coincidencias = 0;
    
    servicios.forEach(servicio => {
      if (tipoServicio.includes(servicio.toLowerCase())) {
        coincidencias++;
      }
    });

    return servicios.length > 0 ? coincidencias / servicios.length : 0.3;
  }

  /**
   * Pr: Coincidencia de precios (0-1)
   */
 static async calcularCoincidenciaPrecios(proveedor, preferencias) {
  const precioProveedor = await this.obtenerPrecioPromedioProveedor(proveedor.id_proveedor);

  // Si el proveedor no tiene precios, valor neutral
  if (precioProveedor === null || isNaN(precioProveedor)) {
    return 0.5;
  }

  const precioMin = preferencias.precio_min !== null && preferencias.precio_min !== "" 
    ? parseFloat(preferencias.precio_min) 
    : null;
  const precioMax = preferencias.precio_max !== null && preferencias.precio_max !== "" 
    ? parseFloat(preferencias.precio_max) 
    : null;

  // Si no hay ningún rango definido, valor neutral
  if (precioMin === null && precioMax === null) {
    return 0.5;
  }

  // Si solo hay mínimo
  if (precioMin !== null && precioMax === null) {
    if (precioProveedor >= precioMin) return 1.0;
    const diferencia = precioMin - precioProveedor;
    if (precioMin === 0) return 0.5;
    return Math.max(0, 0.5 - Math.min(diferencia / precioMin, 0.5));
  }

  // Si solo hay máximo
  if (precioMin === null && precioMax !== null) {
    if (precioProveedor <= precioMax) return 1.0;
    const diferencia = precioProveedor - precioMax;
    if (precioMax === 0) return 0;
    return Math.max(0, 0.5 - Math.min(diferencia / precioMax, 0.5));
  }

  // Ambos definidos
  const min = precioMin;
  const max = precioMax;

  // Si min > max (error del usuario), valor neutral
  if (min > max) return 0.5;

  if (precioProveedor >= min && precioProveedor <= max) {
    const rangoTotal = max - min;
    if (rangoTotal === 0) return 1.0;
    const centro = (min + max) / 2;
    const distanciaAlCentro = Math.abs(precioProveedor - centro);
    const puntuacion = 1 - (distanciaAlCentro / (rangoTotal / 2));
    return Math.max(0.7, Math.min(1, puntuacion));
  }

  if (precioProveedor < min) {
    const diferencia = min - precioProveedor;
    if (min === 0) return 0.5;
    return Math.max(0, 0.5 - Math.min(diferencia / min, 0.5));
  }

  // precioProveedor > max
  const diferencia = precioProveedor - max;
  if (max === 0) return 0;
  return Math.max(0, 0.5 - Math.min(diferencia / max, 0.5));
}

  /**
   * F: Puntuación por fotos en galería (0-1)
   */
  static async calcularPuntuacionFotos(proveedor) {
    try {
      const query = `
        SELECT COUNT(*) as total_fotos
        FROM galeria
        WHERE id_proveedor = $1
      `;
      
      const resultado = await pool.query(query, [proveedor.id_proveedor]);
      const totalFotos = parseInt(resultado.rows[0].total_fotos);

      // Escala: 0 fotos = 0, 10+ fotos = 1
      if (totalFotos === 0) return 0;
      if (totalFotos >= 10) return 1;
      
      return totalFotos / 10;
    } catch (error) {
      console.error('Error en calcularPuntuacionFotos:', error);
      return 0.5;
    }
  }

  /**
   * U: Coincidencia de ubicación (0-1)
   */
  static calcularCoincidenciaUbicacion(proveedor, preferencias) {
    if (!preferencias.ubicacion_preferida) {
      return 0.5; // Neutral si no hay preferencia
    }

    const ubicacionPref = preferencias.ubicacion_preferida.toLowerCase().trim();
    const ubicacionProv = (proveedor.ciudad || '').toLowerCase().trim();

    // Coincidencia exacta
    if (ubicacionProv === ubicacionPref) {
      return 1.0;
    }

    // Coincidencia parcial (contiene)
    if (ubicacionProv.includes(ubicacionPref) || ubicacionPref.includes(ubicacionProv)) {
      return 0.7;
    }

    // Sin coincidencia
    return 0.2;
  }

  /**
   * Obtener preferencias del cliente
   */
  static async obtenerPreferenciasCliente(id_cliente) {
    try {
      const query = 'SELECT * FROM preferencias_cliente WHERE id_cliente = $1';
      const resultado = await pool.query(query, [id_cliente]);
      return resultado.rows[0];
    } catch (error) {
      console.error('Error en obtenerPreferenciasCliente:', error);
      return null;
    }
  }

  /**
   * Obtener todos los proveedores activos y aprobados
   */
  static async obtenerProveedoresActivos() {
    try {
      const query = `
        SELECT 
          id_proveedor,
          nombre_negocio,
          ciudad,
          tipo_servicio,
          descripcion,
          logo,
          COALESCE(calificacion_promedio, 0) as calificacion_promedio
        FROM proveedor
        WHERE estado_aprobacion = 'aprobado'
        AND estado_cuenta = 'activo'
      `;
      
      const resultado = await pool.query(query);
      return resultado.rows;
    } catch (error) {
      console.error('Error en obtenerProveedoresActivos:', error);
      return [];
    }
  }

  /**
   * Obtener precio promedio de los servicios de un proveedor
   */
  static async obtenerPrecioPromedioProveedor(id_proveedor) {
    try {
      const query = `
        SELECT AVG(precio) as precio_promedio
        FROM servicio
        WHERE id_proveedor = $1
      `;
      
      const resultado = await pool.query(query, [id_proveedor]);
      return parseFloat(resultado.rows[0].precio_promedio) || null;
    } catch (error) {
      console.error('Error en obtenerPrecioPromedioProveedor:', error);
      return null;
    }
  }

  /**
   * Obtener proveedores populares (si no hay preferencias)
   */
  static async obtenerProveedoresPopulares(limite = 20) {
    try {
      const query = `
        SELECT 
          p.id_proveedor,
          p.nombre_negocio,
          p.ciudad,
          p.tipo_servicio,
          p.descripcion,
          p.logo,
          COALESCE(p.calificacion_promedio, 0) as calificacion_promedio,
          COUNT(g.id_foto) as total_fotos,
          0.75 as puntuacion_recomendacion
        FROM proveedor p
        LEFT JOIN galeria g ON p.id_proveedor = g.id_proveedor
        WHERE p.estado_aprobacion = 'aprobado'
        AND p.estado_cuenta = 'activo'
        GROUP BY p.id_proveedor
        ORDER BY p.calificacion_promedio DESC NULLS LAST, total_fotos DESC
        LIMIT $1
      `;
      
      const resultado = await pool.query(query, [limite]);
      
      //  Asegurar que calificacion_promedio sea número o null
      return resultado.rows.map(proveedor => ({
        ...proveedor,
        calificacion_promedio: proveedor.calificacion_promedio 
          ? parseFloat(proveedor.calificacion_promedio) 
          : null,
        total_fotos: parseInt(proveedor.total_fotos) || 0
      }));
    } catch (error) {
      console.error('Error en obtenerProveedoresPopulares:', error);
      return [];
    }
  }
}

module.exports = RecomendacionService;