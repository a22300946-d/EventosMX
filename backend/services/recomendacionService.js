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

  // ★ Cuántas solicitudes recientes considerar
  static HISTORIAL_LIMITE = 5;

  /**
   * Obtener proveedores recomendados para un cliente
   */
  static async obtenerRecomendaciones(id_cliente, limite = 20) {
    try {
      // 1. Obtener preferencias del cliente E historial en paralelo
      const [preferencias, historial] = await Promise.all([
        this.obtenerPreferenciasCliente(id_cliente),
        this.obtenerHistorialCliente(id_cliente),   // ★ nuevo
      ]);

      if (!preferencias && historial.length === 0) {
        // Sin ninguna señal → proveedores populares
        return await this.obtenerProveedoresPopulares(limite);
      }

      // ★ 2. Enriquecer (o construir desde cero) las preferencias con el historial
      const preferenciasEfectivas = this.enriquecerPreferenciasConHistorial(
        preferencias,
        historial
      );

      // 3. Obtener todos los proveedores activos
      const proveedores = await this.obtenerProveedoresActivos();

      // 4. Calcular puntuación para cada proveedor
      const proveedoresConPuntuacion = await Promise.all(
        proveedores.map(async (proveedor) => {
          const puntuacion = await this.calcularPuntuacion(proveedor, preferenciasEfectivas);
          return {
            ...proveedor,
            calificacion_promedio: proveedor.calificacion_promedio 
              ? parseFloat(proveedor.calificacion_promedio) 
              : null,
            puntuacion_recomendacion: puntuacion
          };
        })
      );

      // 5. Ordenar por puntuación descendente
      proveedoresConPuntuacion.sort((a, b) => b.puntuacion_recomendacion - a.puntuacion_recomendacion);

      // 6. Retornar los primeros N resultados
      return proveedoresConPuntuacion.slice(0, limite);

    } catch (error) {
      console.error('Error en obtenerRecomendaciones:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ★ NUEVO: Obtener historial reciente del cliente
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Devuelve las últimas N solicitudes del cliente (cualquier estado excepto
   * canceladas), junto con el precio propuesto y la ciudad del proveedor
   * para poder inferir preferencias de comportamiento real.
   *
   * @param {number} id_cliente
   * @returns {Promise<Array>}
   */
  static async obtenerHistorialCliente(id_cliente) {
    try {
      const query = `
        SELECT
          s.tipo_evento,
          s.precio_propuesto,
          s.presupuesto_estimado,
          p.ciudad          AS proveedor_ciudad,
          p.tipo_servicio   AS proveedor_tipo_servicio
        FROM Solicitud s
        INNER JOIN Proveedor p ON s.id_proveedor = p.id_proveedor
        WHERE s.id_cliente = $1
          AND s.estado IN ('Pendiente', 'Respondida', 'Aceptada')
        ORDER BY s.fecha_envio DESC
        LIMIT $2
      `;

      const resultado = await pool.query(query, [id_cliente, this.HISTORIAL_LIMITE]);
      return resultado.rows;
    } catch (error) {
      console.error('Error en obtenerHistorialCliente:', error);
      return [];
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ★ NUEVO: Fusionar preferencias estáticas con señales del historial
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Combina las preferencias guardadas en BD con lo que se puede inferir
   * del comportamiento real del cliente en sus últimas solicitudes.
   *
   * Reglas de fusión:
   *  - servicios_preferidos : agrega los tipos_evento/tipo_servicio del
   *    historial que no estén ya en la lista estática.
   *  - ubicacion_preferida  : si no está definida, usa la ciudad más
   *    frecuente entre los proveedores contactados.
   *  - precio_min / precio_max : si no están definidos, calcula el rango
   *    observado en las solicitudes pasadas (con ±20 % de holgura).
   *
   * Las preferencias estáticas SIEMPRE tienen precedencia; el historial
   * sólo rellena huecos o refuerza señales existentes.
   *
   * @param {Object|null} preferencias  - fila de preferencias_cliente (puede ser null)
   * @param {Array}       historial     - filas devueltas por obtenerHistorialCliente
   * @returns {Object}  preferencias enriquecidas listas para el scoring
   */
  static enriquecerPreferenciasConHistorial(preferencias, historial) {
    // Clonar para no mutar el objeto original
    const efectivas = preferencias
      ? { ...preferencias }
      : {
          servicios_preferidos: null,
          ubicacion_preferida:  null,
          precio_min:           null,
          precio_max:           null,
        };

    if (!historial || historial.length === 0) {
      return efectivas;
    }

    // ── 1. Servicios ──────────────────────────────────────────────────────
    // Recolectar todos los tipos de evento y tipos de servicio del historial
    const tiposDelHistorial = [
      ...new Set([
        ...historial.map(h => h.tipo_evento).filter(Boolean),
        ...historial.map(h => h.proveedor_tipo_servicio).filter(Boolean),
      ])
    ];

    if (tiposDelHistorial.length > 0) {
      if (!efectivas.servicios_preferidos || efectivas.servicios_preferidos === '') {
        // No había preferencia → usamos lo del historial directamente
        efectivas.servicios_preferidos = tiposDelHistorial.join(',');
      } else {
        // Había preferencia → agregamos los tipos del historial que no estén ya
        const existentes = (
          Array.isArray(efectivas.servicios_preferidos)
            ? efectivas.servicios_preferidos
            : efectivas.servicios_preferidos.split(',').map(s => s.trim())
        );
        const nuevos = tiposDelHistorial.filter(
          t => !existentes.map(e => e.toLowerCase()).includes(t.toLowerCase())
        );
        if (nuevos.length > 0) {
          efectivas.servicios_preferidos = [...existentes, ...nuevos].join(',');
        }
      }
    }

    // ── 2. Ubicación ──────────────────────────────────────────────────────
    if (!efectivas.ubicacion_preferida) {
      const ciudades = historial.map(h => h.proveedor_ciudad).filter(Boolean);
      if (ciudades.length > 0) {
        // Ciudad más frecuente en el historial
        const frecuencia = ciudades.reduce((acc, ciudad) => {
          const key = ciudad.toLowerCase().trim();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        const ciudadMasFrecuente = Object.entries(frecuencia)
          .sort(([, a], [, b]) => b - a)[0][0];
        efectivas.ubicacion_preferida = ciudadMasFrecuente;
      }
    }

    // ── 3. Rango de precios ───────────────────────────────────────────────
    const precioMin = parseFloat(efectivas.precio_min);
    const precioMax = parseFloat(efectivas.precio_max);
    const sinRango  = (isNaN(precioMin) || efectivas.precio_min === null) &&
                      (isNaN(precioMax) || efectivas.precio_max === null);

    if (sinRango) {
      // Recolectar precios observados: primero precio_propuesto (real),
      // luego presupuesto_estimado (intención del cliente)
      const preciosObservados = historial
        .map(h => parseFloat(h.precio_propuesto) || parseFloat(h.presupuesto_estimado))
        .filter(p => !isNaN(p) && p > 0);

      if (preciosObservados.length > 0) {
        const minObservado = Math.min(...preciosObservados);
        const maxObservado = Math.max(...preciosObservados);
        const holgura = 0.20; // ±20 % para no ser demasiado rígido

        efectivas.precio_min = Math.max(0, minObservado * (1 - holgura));
        efectivas.precio_max = maxObservado * (1 + holgura);
      }
    }

    return efectivas;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Sin cambios debajo de este punto
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Calcular puntuación de recomendación para un proveedor
   */
  static async calcularPuntuacion(proveedor, preferencias) {
    try {
      const D  = await this.calcularCoincidenciaDescripcion(proveedor, preferencias);
      const S  = await this.calcularCoincidenciaServicios(proveedor, preferencias);
      const Pr = await this.calcularCoincidenciaPrecios(proveedor, preferencias);
      const F  = await this.calcularPuntuacionFotos(proveedor);
      const U  = await this.calcularCoincidenciaUbicacion(proveedor, preferencias);

      const puntuacion =
        (this.PESOS.DESCRIPCION * D)  +
        (this.PESOS.SERVICIOS   * S)  +
        (this.PESOS.PRECIOS     * Pr) +
        (this.PESOS.FOTOS       * F)  +
        (this.PESOS.UBICACION   * U);

      return Math.min(1, Math.max(0, puntuacion));
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
      return 0.5;
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

    if (servicios.includes(proveedor.tipo_servicio)) {
      return 1.0;
    }

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

    if (precioProveedor === null || isNaN(precioProveedor)) {
      return 0.5;
    }

    const precioMin = preferencias.precio_min !== null && preferencias.precio_min !== "" 
      ? parseFloat(preferencias.precio_min) 
      : null;
    const precioMax = preferencias.precio_max !== null && preferencias.precio_max !== "" 
      ? parseFloat(preferencias.precio_max) 
      : null;

    if (precioMin === null && precioMax === null) {
      return 0.5;
    }

    if (precioMin !== null && precioMax === null) {
      if (precioProveedor >= precioMin) return 1.0;
      const diferencia = precioMin - precioProveedor;
      if (precioMin === 0) return 0.5;
      return Math.max(0, 0.5 - Math.min(diferencia / precioMin, 0.5));
    }

    if (precioMin === null && precioMax !== null) {
      if (precioProveedor <= precioMax) return 1.0;
      const diferencia = precioProveedor - precioMax;
      if (precioMax === 0) return 0;
      return Math.max(0, 0.5 - Math.min(diferencia / precioMax, 0.5));
    }

    const min = precioMin;
    const max = precioMax;

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
      return 0.5;
    }

    const ubicacionPref = preferencias.ubicacion_preferida.toLowerCase().trim();
    const ubicacionProv = (proveedor.ciudad || '').toLowerCase().trim();

    if (ubicacionProv === ubicacionPref) return 1.0;
    if (ubicacionProv.includes(ubicacionPref) || ubicacionPref.includes(ubicacionProv)) return 0.7;
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
   * Obtener proveedores populares (si no hay preferencias ni historial)
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