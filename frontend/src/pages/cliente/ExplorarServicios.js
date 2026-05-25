import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clienteService } from "../../services/clienteService";
import api from "../../services/api";
import Layout from "../../components/Layout";
import { useAuth } from "../../hooks/useAuth";
import "./ExplorarServicios.css";

// React Icons
import { FiSearch, FiMapPin, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { BsBuilding } from "react-icons/bs";
import { AiOutlineCalendar } from "react-icons/ai";
import { MdSentimentDissatisfied } from "react-icons/md";
import { FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt, FaHeart, FaRegHeart } from "react-icons/fa";

const ExplorarServicios = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [favoritos, setFavoritos] = useState({});
  const [procesandoFavorito, setProcesandoFavorito] = useState({});

  const [terminoBusqueda, setTerminoBusqueda] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [cargandoSugerencias, setCargandoSugerencias] = useState(false);

  const [filtros, setFiltros] = useState({
    nombre_proveedor: searchParams.get("nombre_proveedor") || "",
    ciudad: searchParams.get("ciudad") || "",
    tipo_evento: searchParams.get("tipo_evento") || "",
    fecha: searchParams.get("fecha") || "",
    precio_min: "",
    precio_max: "",
  });

  const [ordenamiento, setOrdenamiento] = useState("relevancia");
  const [paginaActual, setPaginaActual] = useState(1);
  const proveedoresPorPagina = 12;

  useEffect(() => {
    const obtenerSugerencias = async () => {
      if (terminoBusqueda.length < 2) {
        setSugerencias([]);
        return;
      }

      setCargandoSugerencias(true);

      try {
        const responseProveedores = await clienteService.buscarProveedores({
          nombre_proveedor: terminoBusqueda,
          limite: 5,
        });

        const eventosFiltrados = tiposEventos.filter((evento) =>
          evento.nombre_evento.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );

        const ciudadesComunes = [
          "Guadalajara", "Zapopan", "Tlaquepaque",
          "Tonalá", "Tlajomulco", "Ciudad de México", "Monterrey", "Puebla",
        ];
        const ciudadesFiltradas = ciudadesComunes.filter((ciudad) =>
          ciudad.toLowerCase().includes(terminoBusqueda.toLowerCase())
        );

        const proveedoresEncontrados = responseProveedores.data.data || [];

        const sugerenciasNuevas = [
          ...proveedoresEncontrados.map((p) => ({
            tipo: "proveedor",
            texto: p.nombre_negocio,
            subtexto: p.ciudad,
            icono: "building",
            valor: p.nombre_negocio,
          })),
          ...eventosFiltrados.slice(0, 3).map((e) => ({
            tipo: "evento",
            texto: e.nombre_evento,
            subtexto: "Tipo de evento",
            icono: e.icono || "calendar",
            valor: e.nombre_evento,
          })),
          ...ciudadesFiltradas.slice(0, 2).map((c) => ({
            tipo: "ciudad",
            texto: c,
            subtexto: "Ciudad",
            icono: "pin",
            valor: c,
          })),
        ].slice(0, 8);

        setSugerencias(sugerenciasNuevas);
      } catch (error) {
        console.error("Error al obtener sugerencias:", error);
        setSugerencias([]);
      } finally {
        setCargandoSugerencias(false);
      }
    };

    const timeoutId = setTimeout(obtenerSugerencias, 300);
    return () => clearTimeout(timeoutId);
  }, [terminoBusqueda, tiposEventos]);

  useEffect(() => {
    cargarTiposEventos();
    buscarConFiltros(filtros);
  }, []);

  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarFavoritos();
    }
  }, [user]);

  const cargarFavoritos = async () => {
    try {
      const response = await clienteService.obtenerListaFavoritos();
      const proveedoresFavoritos = response.data.data.proveedores || [];
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

  const buscarConFiltros = async (filtrosParaBuscar) => {
    try {
      setLoading(true);

      let proveedoresData = [];

      if (filtrosParaBuscar.tipo_evento && filtrosParaBuscar.tipo_evento.trim() !== "") {
        try {
          const responseEventos = await api.get("/proveedor-eventos/por-tipo", {
            params: { nombre_evento: filtrosParaBuscar.tipo_evento },
          });
          proveedoresData = responseEventos.data.data || [];
        } catch (error) {
          proveedoresData = [];
        }
      } else {
        const filtrosAPI = {};
        if (filtrosParaBuscar.nombre_proveedor?.trim()) filtrosAPI.nombre_proveedor = filtrosParaBuscar.nombre_proveedor;
        if (filtrosParaBuscar.ciudad?.trim()) filtrosAPI.ciudad = filtrosParaBuscar.ciudad;
        if (Object.keys(filtrosAPI).length === 0) filtrosAPI.limite = 100;

        const response = await clienteService.buscarProveedores(filtrosAPI);
        proveedoresData = response.data.data || [];
      }

      if (filtrosParaBuscar.ciudad?.trim()) {
        proveedoresData = proveedoresData.filter(
          (p) => p.ciudad?.toLowerCase() === filtrosParaBuscar.ciudad.toLowerCase()
        );
      }

      if (filtrosParaBuscar.nombre_proveedor?.trim()) {
        const termino = filtrosParaBuscar.nombre_proveedor.toLowerCase();
        proveedoresData = proveedoresData.filter(
          (p) => p.nombre_negocio?.toLowerCase().includes(termino)
        );
      }

      if (filtrosParaBuscar.fecha?.trim()) {
        const proveedoresConDisponibilidad = await Promise.all(
          proveedoresData.map(async (proveedor) => {
            try {
              const responseCalendario = await api.get(
                `/calendario/proveedor/${proveedor.id_proveedor}/disponibilidad`,
                { params: { fecha_inicio: filtrosParaBuscar.fecha, fecha_fin: filtrosParaBuscar.fecha } }
              );
              const fechasBloqueadas = responseCalendario.data.data || [];
              const fechaBloqueada = fechasBloqueadas.find(
                (f) => f.disponible === false && f.fecha.split("T")[0] === filtrosParaBuscar.fecha
              );
              return { ...proveedor, disponible: !fechaBloqueada };
            } catch {
              return { ...proveedor, disponible: true };
            }
          })
        );
        proveedoresData = proveedoresConDisponibilidad.filter((p) => p.disponible);
      }

      const proveedoresConPrecio = await Promise.all(
        proveedoresData.map(async (proveedor) => {
          try {
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: { id_proveedor: proveedor.id_proveedor, limite: 100 },
            });
            const servicios = serviciosResponse.data.data || [];
            const serviciosProveedor = servicios.filter((s) => s.id_proveedor === proveedor.id_proveedor);
            const precios = serviciosProveedor.map((s) => parseFloat(s.precio)).filter((p) => !isNaN(p) && p > 0);
            return { ...proveedor, precio_minimo: precios.length > 0 ? Math.min(...precios) : null };
          } catch {
            return { ...proveedor, precio_minimo: null };
          }
        })
      );

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

      setProveedores(proveedoresFiltrados);
    } catch (error) {
      console.error("Error en búsqueda:", error);
      setProveedores([]);
      setPaginaActual(1);
    } finally {
      setLoading(false);
    }
  };

  const ordenarProveedores = (proveedoresParaOrdenar) => {
    const copiaProveedores = [...proveedoresParaOrdenar];

    switch (ordenamiento) {
      case "relevancia":
        return copiaProveedores.sort((a, b) => {
          const terminoLower = filtros.nombre_proveedor.toLowerCase();
          const coincidenciaA = a.nombre_negocio.toLowerCase().includes(terminoLower) ? 1 : 0;
          const coincidenciaB = b.nombre_negocio.toLowerCase().includes(terminoLower) ? 1 : 0;
          if (coincidenciaA !== coincidenciaB) return coincidenciaB - coincidenciaA;
          return (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0);
        });
      case "calificacion":
        return copiaProveedores.sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0));
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

  const handleFiltroChange = (campo, valor) => {
    setFiltros({ ...filtros, [campo]: valor });
  };

  const aplicarFiltros = () => {
    setPaginaActual(1);
    buscarConFiltros(filtros);
  };

  const limpiarFiltros = () => {
    const filtrosVacios = {
      nombre_proveedor: "", ciudad: "", tipo_evento: "",
      fecha: "", precio_min: "", precio_max: "",
    };
    setFiltros(filtrosVacios);
    setTerminoBusqueda("");
    setPaginaActual(1);
    buscarConFiltros(filtrosVacios);
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
        alert("Debes iniciar sesión para guardar favoritos");
        navigate("/login");
      } else {
        alert("Error al actualizar favoritos");
      }
    } finally {
      setProcesandoFavorito((prev) => ({ ...prev, [idProveedor]: false }));
    }
  };

  const proveedoresOrdenados = ordenarProveedores(proveedores);
  const indiceUltimo = paginaActual * proveedoresPorPagina;
  const indicePrimero = indiceUltimo - proveedoresPorPagina;
  const proveedoresActuales = proveedoresOrdenados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(proveedoresOrdenados.length / proveedoresPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;
    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        estrellas.push(<FaStar key={i} className="estrella-llena-home" />);
      } else if (calificacionEstrellas >= i - 0.5) {
        estrellas.push(<FaStarHalfAlt key={i} className="estrella-media-home" />);
      } else {
        estrellas.push(<FaRegStar key={i} className="estrella-vacia-home" />);
      }
    }
    return estrellas;
  };

  const renderIconoSugerencia = (icono) => {
    if (icono === "building") return <BsBuilding />;
    if (icono === "pin") return <FiMapPin />;
    return <AiOutlineCalendar />;
  };

  return (
    <Layout showNav={true}>
      <div className="explorar-servicios">
        <div className="explorar-header">
          <h1>Explorar Proveedores</h1>
          <p className="explorar-subtitle">
            Encuentra el proveedor perfecto para tu evento
          </p>
        </div>

        {/* Barra de búsqueda */}
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
              <FiSearch /> Buscar
            </button>
          </div>

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
                  <span className="sugerencia-icono">
                    {renderIconoSugerencia(sug.icono)}
                  </span>
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

            <div className="filtro-seccion">
              <label>Tipo de Evento</label>
              <div className="tipo-evento-grid">
                {tiposEventos.map((evento) => (
                  <div
                    key={evento.id_tipo_evento}
                    className={`tipo-evento-card ${filtros.tipo_evento === evento.nombre_evento ? "activo" : ""}`}
                    onClick={() => handleSeleccionarTipoEvento(evento.nombre_evento)}
                  >
                    <span className="tipo-evento-icono">{evento.icono}</span>
                    <span className="tipo-evento-nombre">{evento.nombre_evento}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="filtro-seccion">
              <label>Ciudad</label>
              <select value={filtros.ciudad} onChange={(e) => handleFiltroChange("ciudad", e.target.value)}>
                <option value="">Todas las ciudades</option>
                <option value="Guadalajara">Guadalajara</option>
                <option value="Zapopan">Zapopan</option>
                <option value="Tlaquepaque">Tlaquepaque</option>
                <option value="Tonalá">Tonalá</option>
                <option value="Tlajomulco">Tlajomulco</option>
              </select>
            </div>

            <div className="filtro-seccion">
              <label>Fecha del Evento</label>
              <input
                type="date"
                value={filtros.fecha}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => handleFiltroChange("fecha", e.target.value)}
              />
            </div>

            <div className="filtro-seccion">
              <label>Rango de Precios</label>
              <div className="precio-inputs" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={filtros.precio_min}
                  onChange={(e) => handleFiltroChange("precio_min", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={filtros.precio_max}
                  onChange={(e) => handleFiltroChange("precio_max", e.target.value)}
                />
              </div>
            </div>

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

            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Buscando proveedores...</p>
              </div>
            )}

            {!loading && proveedoresOrdenados.length === 0 && (
              <div className="sin-resultados">
                <MdSentimentDissatisfied size={32} />
                <p>No se encontraron proveedores con estos filtros</p>
                <button onClick={limpiarFiltros}>Limpiar Filtros</button>
              </div>
            )}

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
                        <div className="proveedor-image-home">
                          <img
                            src={proveedor.logo || "https://res.cloudinary.com/eventosmx/image/upload/v1779458200/40af2d21-bdfb-4bbc-a9f6-a4f2f8f55180_bb9fek.jpg"}
                            alt={proveedor.nombre_negocio}
                            onError={(e) => {
                              e.target.src = "https://res.cloudinary.com/eventosmx/image/upload/v1779458200/40af2d21-bdfb-4bbc-a9f6-a4f2f8f55180_bb9fek.jpg";
                            }}
                          />
                          <button
                            className={`btn-favorito-home ${esFavorito ? "favorito-activo" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorito(proveedor.id_proveedor);
                            }}
                            disabled={procesandoFavorito[proveedor.id_proveedor]}
                            title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                          >
                            {esFavorito ? <FaHeart /> : <FaRegHeart />}
                          </button>
                        </div>

                        <div className="proveedor-info-home">
                          <div className="proveedor-rating-home">
                            {renderEstrellas(calificacion)}
                            <span className="rating-numero">{calificacionDe5.toFixed(1)}/5</span>
                          </div>

                          <h3>{proveedor.nombre_negocio}</h3>

                          {proveedor.ciudad && (
                            <p className="proveedor-ubicacion-home">
                              <FaMapMarkerAlt style={{ marginRight: "4px", color: "#e74c3c" }} />
                              {proveedor.ciudad}
                            </p>
                          )}

                          {proveedor.descripcion && (
                            <p className="proveedor-descripcion-home">
                              {proveedor.descripcion.length > 80
                                ? `${proveedor.descripcion.substring(0, 80)}...`
                                : proveedor.descripcion}
                            </p>
                          )}

                          {proveedor.precio_minimo !== null && proveedor.precio_minimo > 0 ? (
                            <p className="proveedor-precio">
                              Desde ${proveedor.precio_minimo.toLocaleString("es-MX")}
                            </p>
                          ) : (
                            <p className="proveedor-sin-precio">Sin servicios disponibles</p>
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

                {totalPaginas > 1 && (
                  <div className="paginacion">
                    <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>
                      <FiChevronLeft /> Anterior
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
                    <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>
                      Siguiente <FiChevronRight />
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