import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clienteService } from "../../services/clienteService"; // ✅ CORREGIDO: named import
import api from "../../services/api";
import Layout from "../../components/Layout"; // ✅ AGREGAR Layout
import { useAuth } from "../../hooks/useAuth"; // ✅ AGREGAR useAuth
import "./ExplorarServicios.css";

const ExplorarServicios = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // ✅ AGREGAR useAuth

  // Estados principales
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [favoritos, setFavoritos] = useState({});
  const [procesandoFavorito, setProcesandoFavorito] = useState({});

  // ✅ RQF14, RQF18: Barra de búsqueda con sugerencias
  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  // Estados de filtros
  const [filtros, setFiltros] = useState({
    nombre_proveedor: searchParams.get("nombre_proveedor") || "",
    ciudad: searchParams.get("ciudad") || "",
    tipo_evento: searchParams.get("tipo_evento") || "",
    fecha: searchParams.get("fecha") || "",
    precio_min: "",
    precio_max: "",
  });

  // ✅ RQF17: Estado de ordenamiento
  const [ordenamiento, setOrdenamiento] = useState("relevancia");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const proveedoresPorPagina = 12;

  // ============================================
  // ✅ RQF18, RQNF9: SUGERENCIAS AUTOMÁTICAS (< 1 segundo)
  // ============================================
  useEffect(() => {
    const obtenerSugerencias = async () => {
      if (terminoBusqueda.length < 2) {
        setSugerencias([]);
        return;
      }

      setCargandoSugerencias(true);
      const inicio = performance.now();

      try {
        // Buscar en proveedores
        const responseProveedores = await clienteService.buscarProveedores({
          nombre_proveedor: terminoBusqueda,
          limite: 5,
        });

        // Buscar en tipos de eventos
        const eventosFiltrados = tiposEventos.filter((evento) =>
          evento.nombre_evento.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );

        // Buscar en ciudades (simplificado)
        const ciudadesComunes = [
          "Guadalajara",
          "Zapopan",
          "Tlaquepaque",
          "Tonalá",
          "Tlajomulco",
          "Ciudad de México",
          "Monterrey",
          "Puebla",
        ];
        const ciudadesFiltradas = ciudadesComunes.filter((ciudad) =>
          ciudad.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );

        const proveedoresEncontrados = responseProveedores.data.data || [];

        // Combinar sugerencias
        const sugerenciasNuevas = [
          ...proveedoresEncontrados.map((p) => ({
            tipo: "proveedor",
            texto: p.nombre_negocio,
            subtexto: p.ciudad,
            icono: "🏢",
            valor: p.nombre_negocio,
          })),
          ...eventosFiltrados.slice(0, 3).map((e) => ({
            tipo: "evento",
            texto: e.nombre_evento,
            subtexto: "Tipo de evento",
            icono: e.icono || "🎉",
            valor: e.nombre_evento,
          })),
          ...ciudadesFiltradas.slice(0, 2).map((c) => ({
            tipo: "ciudad",
            texto: c,
            subtexto: "Ciudad",
            icono: "📍",
            valor: c,
          })),
        ].slice(0, 8);

        const fin = performance.now();
        const tiempo = fin - inicio;
        console.log(`⏱️ Sugerencias generadas en ${tiempo.toFixed(0)}ms`);

        setSugerencias(sugerenciasNuevas);
      } catch (error) {
        console.error("Error al obtener sugerencias:", error);
        setSugerencias([]);
      } finally {
        setCargandoSugerencias(false);
      }
    };

    // Debounce de 300ms
    const timeoutId = setTimeout(obtenerSugerencias, 300);
    return () => clearTimeout(timeoutId);
  }, [terminoBusqueda, tiposEventos]);

  // ============================================
  // CARGAR DATOS INICIALES
  // ============================================
  useEffect(() => {
    cargarTiposEventos();
    buscarConFiltros(filtros);
  }, []);

  // ✅ Cargar favoritos solo si es cliente autenticado (IGUAL QUE HOME)
  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarFavoritos();
    }
  }, [user]);

  const cargarFavoritos = async () => {
    try {
      const response = await clienteService.obtenerListaFavoritos();
      const proveedoresFavoritos = response.data.data.proveedores || [];
      
      // Crear objeto con id_proveedor como key y id_lista_proveedor como value
      const favoritosMap = {};
      proveedoresFavoritos.forEach((fav) => {
        favoritosMap[fav.id_proveedor] = fav.id_lista_proveedor;
      });
      
      setFavoritos(favoritosMap);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    }
  };

  const cargarTiposEventos = async () => {
    try {
      const response = await api.get("/tipos-eventos");
      setTiposEventos(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar tipos de eventos:", error);
    }
  };

  // ============================================
  // ✅ BÚSQUEDA CON FILTROS
  // ============================================
  const buscarConFiltros = async (filtrosParaBuscar) => {
    try {
      setLoading(true);
      const inicioBusqueda = performance.now();

      let proveedoresData = [];

      // Si hay tipo_evento, buscar en ProveedorEvento
      if (filtrosParaBuscar.tipo_evento && filtrosParaBuscar.tipo_evento.trim() !== "") {
        console.log("🔍 Buscando proveedores con tipo de evento:", filtrosParaBuscar.tipo_evento);

        try {
          const responseEventos = await api.get("/proveedor-eventos/por-tipo", {
            params: {
              nombre_evento: filtrosParaBuscar.tipo_evento,
            },
          });

          proveedoresData = responseEventos.data.data || [];
          console.log("✅ Proveedores encontrados:", proveedoresData.length);
        } catch (error) {
          console.error("❌ Error al buscar por tipo de evento:", error);
          proveedoresData = [];
        }
      } else {
        // Búsqueda normal
        const filtrosAPI = {};

        if (filtrosParaBuscar.nombre_proveedor && filtrosParaBuscar.nombre_proveedor.trim() !== "") {
          filtrosAPI.nombre_proveedor = filtrosParaBuscar.nombre_proveedor;
        }

        if (filtrosParaBuscar.ciudad && filtrosParaBuscar.ciudad.trim() !== "") {
          filtrosAPI.ciudad = filtrosParaBuscar.ciudad;
        }

        if (Object.keys(filtrosAPI).length === 0) {
          filtrosAPI.limite = 100;
        }

        const response = await clienteService.buscarProveedores(filtrosAPI);
        proveedoresData = response.data.data || [];
      }

      // Aplicar filtros adicionales
      if (filtrosParaBuscar.ciudad && filtrosParaBuscar.ciudad.trim() !== "") {
        proveedoresData = proveedoresData.filter(
          (p) => p.ciudad && p.ciudad.toLowerCase() === filtrosParaBuscar.ciudad.toLowerCase()
        );
      }

      if (filtrosParaBuscar.nombre_proveedor && filtrosParaBuscar.nombre_proveedor.trim() !== "") {
        const termino = filtrosParaBuscar.nombre_proveedor.toLowerCase();
        proveedoresData = proveedoresData.filter(
          (p) => p.nombre_negocio && p.nombre_negocio.toLowerCase().includes(termino)
        );
      }

      // ✅ RQF20: Filtrar por fecha disponible
      if (filtrosParaBuscar.fecha && filtrosParaBuscar.fecha.trim() !== "") {
        console.log('📅 Filtrando por fecha disponible:', filtrosParaBuscar.fecha);
        
        const proveedoresConDisponibilidad = await Promise.all(
          proveedoresData.map(async (proveedor) => {
            try {
              // Usar el endpoint correcto: /calendario/proveedor/:id/disponibilidad
              // Necesita fecha_inicio y fecha_fin
              const responseCalendario = await api.get(
                `/calendario/proveedor/${proveedor.id_proveedor}/disponibilidad`,
                {
                  params: { 
                    fecha_inicio: filtrosParaBuscar.fecha,
                    fecha_fin: filtrosParaBuscar.fecha
                  },
                }
              );

              // Si devuelve datos, buscar si la fecha está bloqueada
              const fechasBloqueadas = responseCalendario.data.data || [];
              
              // Si NO hay fechas bloqueadas, está disponible
              // Si hay fechas bloqueadas y alguna tiene disponible=false, NO está disponible
              const fechaBloqueada = fechasBloqueadas.find(
                f => f.disponible === false && f.fecha.split('T')[0] === filtrosParaBuscar.fecha
              );
              
              const disponible = !fechaBloqueada; // Disponible si NO encontró fecha bloqueada
              
              return {
                ...proveedor,
                disponible: disponible,
              };
            } catch (error) {
              // Si hay error (400, 404) o no tiene calendario, asumimos disponible
              console.log(`Proveedor ${proveedor.id_proveedor}: Sin calendario o disponible por defecto`);
              return { 
                ...proveedor, 
                disponible: true // Por defecto disponible
              };
            }
          })
        );

        // Filtrar solo los disponibles
        proveedoresData = proveedoresConDisponibilidad.filter((p) => p.disponible);
        console.log(`✅ Proveedores disponibles en ${filtrosParaBuscar.fecha}: ${proveedoresData.length}`);
      }

      // Obtener precios mínimos
      const proveedoresConPrecio = await Promise.all(
        proveedoresData.map(async (proveedor) => {
          try {
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: {
                id_proveedor: proveedor.id_proveedor,
                limite: 100,
              },
            });

            const servicios = serviciosResponse.data.data || [];
            const serviciosProveedor = servicios.filter((s) => s.id_proveedor === proveedor.id_proveedor);

            let precioMinimo = null;
            if (serviciosProveedor.length > 0) {
              const precios = serviciosProveedor.map((s) => parseFloat(s.precio)).filter((p) => !isNaN(p) && p > 0);

              if (precios.length > 0) {
                precioMinimo = Math.min(...precios);
              }
            }

            return {
              ...proveedor,
              precio_minimo: precioMinimo,
            };
          } catch (error) {
            return {
              ...proveedor,
              precio_minimo: null,
            };
          }
        })
      );

      // ✅ RQF16: Filtrar por rango de precios
      let proveedoresFiltrados = proveedoresConPrecio;

      if (filtrosParaBuscar.precio_min && parseFloat(filtrosParaBuscar.precio_min) > 0) {
        proveedoresFiltrados = proveedoresFiltrados.filter(
          (p) => p.precio_minimo !== null && p.precio_minimo >= parseFloat(filtrosParaBuscar.precio_min)
        );
      }

      if (filtrosParaBuscar.precio_max && parseFloat(filtrosParaBuscar.precio_max) > 0) {
        proveedoresFiltrados = proveedoresFiltrados.filter(
          (p) => p.precio_minimo !== null && p.precio_minimo <= parseFloat(filtrosParaBuscar.precio_max)
        );
      }

      const finBusqueda = performance.now();
      const tiempoBusqueda = finBusqueda - inicioBusqueda;
      console.log(`📊 Total proveedores después de filtros: ${proveedoresFiltrados.length}`);
      console.log(`⏱️ Búsqueda completada en ${tiempoBusqueda.toFixed(0)}ms`);

      setProveedores(proveedoresFiltrados);
    } catch (error) {
      console.error("❌ Error en búsqueda:", error);
      setProveedores([]);
      setPaginaActual(1);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ✅ RQF17: ORDENAR RESULTADOS
  // ============================================
  const ordenarProveedores = (proveedoresParaOrdenar) => {
    const copiaProveedores = [...proveedoresParaOrdenar];

    switch (ordenamiento) {
      case "relevancia":
        // Ordenar por coincidencia con término de búsqueda + calificación
        return copiaProveedores.sort((a, b) => {
          const terminoLower = filtros.nombre_proveedor.toLowerCase();
          const coincidenciaA = a.nombre_negocio.toLowerCase().includes(terminoLower) ? 1 : 0;
          const coincidenciaB = b.nombre_negocio.toLowerCase().includes(terminoLower) ? 1 : 0;

          if (coincidenciaA !== coincidenciaB) {
            return coincidenciaB - coincidenciaA;
          }

          const calificacionA = a.calificacion_promedio || 0;
          const calificacionB = b.calificacion_promedio || 0;
          return calificacionB - calificacionA;
        });

      case "calificacion":
        return copiaProveedores.sort((a, b) => {
          const calA = a.calificacion_promedio || 0;
          const calB = b.calificacion_promedio || 0;
          return calB - calA;
        });

      case "precio_asc":
        return copiaProveedores.sort((a, b) => {
          if (a.precio_minimo === null) return 1;
          if (b.precio_minimo === null) return -1;
          return a.precio_minimo - b.precio_minimo;
        });

      case "precio_desc":
        return copiaProveedores.sort((a, b) => {
          if (a.precio_minimo === null) return 1;
          if (b.precio_minimo === null) return -1;
          return b.precio_minimo - a.precio_minimo;
        });

      case "alfabetico":
        return copiaProveedores.sort((a, b) => a.nombre_negocio.localeCompare(b.nombre_negocio));

      default:
        return copiaProveedores;
    }
  };

  // ============================================
  // MANEJO DE FILTROS
  // ============================================
  const handleFiltroChange = (campo, valor) => {
    const nuevosFiltros = { ...filtros, [campo]: valor };
    setFiltros(nuevosFiltros);
  };

  const aplicarFiltros = () => {
    setPaginaActual(1);
    buscarConFiltros(filtros);
  };

  // ✅ RQF22, RQNF11: Limpiar filtros (< 1 segundo)
  const limpiarFiltros = () => {
    const inicioLimpieza = performance.now();

    const filtrosVacios = {
      nombre_proveedor: "",
      ciudad: "",
      tipo_evento: "",
      fecha: "",
      precio_min: "",
      precio_max: "",
    };

    setFiltros(filtrosVacios);
    setTerminoBusqueda("");
    setPaginaActual(1);
    buscarConFiltros(filtrosVacios);

    const finLimpieza = performance.now();
    console.log(`⏱️ Filtros limpiados en ${(finLimpieza - inicioLimpieza).toFixed(0)}ms`);
  };

  const handleSeleccionarTipoEvento = (nombreEvento) => {
    const nuevosFiltros = {
      ...filtros,
      tipo_evento: filtros.tipo_evento === nombreEvento ? "" : nombreEvento,
    };
    setFiltros(nuevosFiltros);
    setPaginaActual(1);
    buscarConFiltros(nuevosFiltros);
  };

  // ============================================
  // MANEJO DE SUGERENCIAS
  // ============================================
  const handleSeleccionarSugerencia = (sugerencia) => {
    if (sugerencia.tipo === "proveedor") {
      setFiltros({ ...filtros, nombre_proveedor: sugerencia.valor });
      setTerminoBusqueda(sugerencia.valor);
    } else if (sugerencia.tipo === "evento") {
      setFiltros({ ...filtros, tipo_evento: sugerencia.valor });
      setTerminoBusqueda("");
    } else if (sugerencia.tipo === "ciudad") {
      setFiltros({ ...filtros, ciudad: sugerencia.valor });
      setTerminoBusqueda("");
    }

    setMostrarSugerencias(false);
    setTimeout(() => aplicarFiltros(), 100);
  };

  // ============================================
  // FAVORITOS
  // ============================================
  const toggleFavorito = async (idProveedor) => {
    try {
      setProcesandoFavorito((prev) => ({ ...prev, [idProveedor]: true }));

      if (favoritos[idProveedor]) {
        await clienteService.eliminarDeFavoritos(favoritos[idProveedor]);
        setFavoritos((prev) => {
          const newFavoritos = { ...prev };
          delete newFavoritos[idProveedor];
          return newFavoritos;
        });
      } else {
        const response = await clienteService.agregarAFavoritos(idProveedor);
        setFavoritos((prev) => ({
          ...prev,
          [idProveedor]: response.data.data.id_lista_proveedor,
        }));
      }
    } catch (error) {
      console.error("Error al gestionar favorito:", error);
      if (error.response?.status === 401) {
        alert("⚠️ Debes iniciar sesión para guardar favoritos");
        navigate("/login");
      } else {
        alert("❌ Error al actualizar favoritos");
      }
    } finally {
      setProcesandoFavorito((prev) => ({ ...prev, [idProveedor]: false }));
    }
  };

  // ============================================
  // PAGINACIÓN
  // ============================================
  const proveedoresOrdenados = ordenarProveedores(proveedores);
  const indiceUltimo = paginaActual * proveedoresPorPagina;
  const indicePrimero = indiceUltimo - proveedoresPorPagina;
  const proveedoresActuales = proveedoresOrdenados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(proveedoresOrdenados.length / proveedoresPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Función para renderizar estrellas (igual que en Home)
  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;

    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        estrellas.push(<span key={i} className="estrella-llena-home">★</span>);
      } else if (calificacionEstrellas >= i - 0.5) {
        estrellas.push(<span key={i} className="estrella-media-home">★</span>);
      } else {
        estrellas.push(<span key={i} className="estrella-vacia-home">☆</span>);
      }
    }

    return estrellas;
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Layout showNav={true}>
      <div className="explorar-servicios">
      <div className="explorar-header">
        <h1>Explorar Proveedores</h1>
        <p className="explorar-subtitle">
          Encuentra el proveedor perfecto para tu evento
        </p>
      </div>

      {/* ✅ RQF14, RQF18: Barra de búsqueda con sugerencias */}
      <div className="barra-busqueda-container">
        <div className="barra-busqueda">
          <input
            type="text"
            placeholder="Buscar proveedores, servicios o ciudades..."
            value={terminoBusqueda}
            onChange={(e) => {
              setTerminoBusqueda(e.target.value);
              setMostrarSugerencias(true);
            }}
            onFocus={() => setMostrarSugerencias(true)}
            onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
          />
          <button onClick={aplicarFiltros}>
            <span>🔍</span> Buscar
          </button>
        </div>

        {/* Sugerencias */}
        {mostrarSugerencias && sugerencias.length > 0 && (
          <div className="sugerencias-dropdown">
            {cargandoSugerencias && (
              <div className="sugerencia-item loading">
                <span>Buscando...</span>
              </div>
            )}
            {sugerencias.map((sug, index) => (
              <div
                key={index}
                className="sugerencia-item"
                onClick={() => handleSeleccionarSugerencia(sug)}
              >
                <span className="sugerencia-icono">{sug.icono}</span>
                <div className="sugerencia-texto">
                  <strong>{sug.texto}</strong>
                  <small>{sug.subtexto}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="explorar-contenido">
        {/* SIDEBAR DE FILTROS */}
        <aside className="filtros-sidebar">
          <h3>Filtros</h3>

          {/* Tipo de Evento */}
          <div className="filtro-seccion">
            <label>Tipo de Evento</label>
            <div className="tipo-evento-grid">
              {tiposEventos.map((evento) => (
                <div
                  key={evento.id_tipo_evento}
                  className={`tipo-evento-card ${
                    filtros.tipo_evento === evento.nombre_evento ? "activo" : ""
                  }`}
                  onClick={() => handleSeleccionarTipoEvento(evento.nombre_evento)}
                >
                  <span className="tipo-evento-icono">{evento.icono}</span>
                  <span className="tipo-evento-nombre">{evento.nombre_evento}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ciudad */}
          <div className="filtro-seccion">
            <label>Ciudad</label>
            <select
              value={filtros.ciudad}
              onChange={(e) => handleFiltroChange("ciudad", e.target.value)}
            >
              <option value="">Todas las ciudades</option>
              <option value="Guadalajara">Guadalajara</option>
              <option value="Zapopan">Zapopan</option>
              <option value="Tlaquepaque">Tlaquepaque</option>
              <option value="Tonalá">Tonalá</option>
              <option value="Tlajomulco">Tlajomulco</option>
            </select>
          </div>

          {/* ✅ RQF20: Fecha disponible */}
          <div className="filtro-seccion">
            <label>Fecha del Evento</label>
            <input
              type="date"
              value={filtros.fecha}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => handleFiltroChange("fecha", e.target.value)}
            />
          </div>

          {/* ✅ RQF16: Rango de precios */}
          <div className="filtro-seccion">
            <label>Rango de Precios</label>
            <div className="precio-inputs">
              <input
                type="number"
                placeholder="Mínimo"
                value={filtros.precio_min}
                onChange={(e) => handleFiltroChange("precio_min", e.target.value)}
              />
              <span>-</span>
              <input
                type="number"
                placeholder="Máximo"
                value={filtros.precio_max}
                onChange={(e) => handleFiltroChange("precio_max", e.target.value)}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="filtros-botones">
            <button className="btn-aplicar" onClick={aplicarFiltros}>
              Aplicar Filtros
            </button>
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar Todo
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="resultados-main">
          {/* ✅ RQF21: Contador de resultados + RQF17: Ordenamiento */}
          <div className="resultados-header">
            <p className="resultados-contador">
              {proveedoresOrdenados.length} proveedor{proveedoresOrdenados.length !== 1 ? "es" : ""}{" "}
              encontrado{proveedoresOrdenados.length !== 1 ? "s" : ""}
            </p>

            <div className="ordenamiento">
              <label>Ordenar por:</label>
              <select value={ordenamiento} onChange={(e) => setOrdenamiento(e.target.value)}>
                <option value="relevancia">Relevancia</option>
                <option value="calificacion">Mejor Calificados</option>
                <option value="precio_asc">Precio: Menor a Mayor</option>
                <option value="precio_desc">Precio: Mayor a Menor</option>
                <option value="alfabetico">Alfabético</option>
              </select>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Buscando proveedores...</p>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && proveedoresOrdenados.length === 0 && (
            <div className="sin-resultados">
              <p>😔 No se encontraron proveedores con estos filtros</p>
              <button onClick={limpiarFiltros}>Limpiar Filtros</button>
            </div>
          )}

          {/* Grid de proveedores */}
          {!loading && proveedoresOrdenados.length > 0 && (
            <>
              <div className="proveedores-grid">
                {proveedoresActuales.map((proveedor) => {
                  const esFavorito = !!favoritos[proveedor.id_proveedor];
                  const calificacion = parseFloat(proveedor.calificacion_promedio) || 0;
                  const calificacionDe5 = calificacion * 5;

                  return (
                    <div
                      key={proveedor.id_proveedor}
                      className="proveedor-card-home"
                      onClick={() => navigate(`/perfil-proveedor/${proveedor.id_proveedor}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {/* Imagen */}
                      <div className="proveedor-image-home">
                        {proveedor.logo ? (
                          <img 
                            src={proveedor.logo} 
                            alt={proveedor.nombre_negocio}
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                        ) : (
                          <img 
                            src="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            alt={proveedor.nombre_negocio}
                          />
                        )}

                        {/* Botón favorito */}
                        <button
                          className={`btn-favorito-home ${esFavorito ? "favorito-activo" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorito(proveedor.id_proveedor);
                          }}
                          disabled={procesandoFavorito[proveedor.id_proveedor]}
                          title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                        >
                          {esFavorito ? "♥" : "♡"}
                        </button>
                      </div>

                      {/* Info */}
                      <div className="proveedor-info-home">
                        {/* Rating con estrellas */}
                        {proveedor.calificacion_promedio && (
                          <div className="proveedor-rating-home">
                            {renderEstrellas(calificacion)}
                            <span className="rating-numero">
                              {calificacionDe5.toFixed(1)}/5
                            </span>
                          </div>
                        )}

                        <h3>{proveedor.nombre_negocio}</h3>

                        {proveedor.precio_minimo !== null && proveedor.precio_minimo > 0 ? (
                          <p className="proveedor-precio">
                            Desde ${proveedor.precio_minimo.toLocaleString("es-MX")}
                          </p>
                        ) : (
                          <p className="proveedor-sin-precio">
                            Sin servicios disponibles
                          </p>
                        )}

                        <div className="proveedor-footer-home">
                          <span className="categoria-badge-home">
                            {proveedor.tipo_servicio || "Servicio"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="paginacion">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                  >
                    ← Anterior
                  </button>

                  <div className="paginacion-numeros">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        className={num === paginaActual ? "activo" : ""}
                        onClick={() => cambiarPagina(num)}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
    </Layout>
  );
};

export default ExplorarServicios;