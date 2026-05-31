import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import {
  FaStar, FaStarHalfAlt, FaRegStar, FaMapMarkerAlt,
  FaSlidersH, FaMagic, FaCog,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";
import { MdCelebration } from "react-icons/md";
import { clienteService } from "../services/clienteService";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import "./Home.css";

const POR_PAGINA = 6;

function Home() {
  const [ciudades, setCiudades] = useState([]);
  const [tiposEventos, setTiposEventos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [favoritos, setFavoritos] = useState({});
  const [procesandoFavorito, setProcesandoFavorito] = useState(false);
  const [filtros, setFiltros] = useState({
    nombre_proveedor: "",
    ubicacion: "",
    fecha: "",
  });
  const [tienePreferencias, setTienePreferencias] = useState(false);
  const [mostrandoRecomendaciones, setMostrandoRecomendaciones] = useState(false);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);

  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    cargarTiposEventos();
    cargarCiudades();
  }, []);

  const verificarPreferenciasYCargarProveedores = useCallback(async () => {
    try {
      setCargandoProveedores(true);

      const prefResponse = await api.get("/recomendaciones/preferencias");
      const tienePrefs = prefResponse.data.data !== null;

      setTienePreferencias(tienePrefs);

      if (tienePrefs) {
        await cargarRecomendaciones();
        setMostrandoRecomendaciones(true);
      } else {
        await cargarProveedoresDestacados();
        setMostrandoRecomendaciones(false);
      }
    } catch (error) {
      console.error("Error al verificar preferencias:", error);
      await cargarProveedoresDestacados();
      setMostrandoRecomendaciones(false);
    } finally {
      setCargandoProveedores(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarFavoritos();
      verificarPreferenciasYCargarProveedores();
    } else {
      cargarProveedoresDestacados();
    }
  }, [user, verificarPreferenciasYCargarProveedores]);

  useEffect(() => {
    setPaginaActual(1);
  }, [mostrandoRecomendaciones]);

  // ── Paginación ────────────────────────────────────────────────

  const totalPaginas = Math.max(1, Math.ceil(proveedores.length / POR_PAGINA));
  const inicio       = (paginaActual - 1) * POR_PAGINA;
  const paginados    = proveedores.slice(inicio, inicio + POR_PAGINA);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
    const seccion = document.querySelector(".proveedores-destacados");
    window.scrollTo({ top: seccion ? seccion.offsetTop - 80 : 0, behavior: "smooth" });
  };

  const getPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1);
    const p = [];
    if (paginaActual <= 4) {
      p.push(1, 2, 3, 4, 5, "...", totalPaginas);
    } else if (paginaActual >= totalPaginas - 3) {
      p.push(1, "...", totalPaginas - 4, totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas);
    } else {
      p.push(1, "...", paginaActual - 1, paginaActual, paginaActual + 1, "...", totalPaginas);
    }
    return p;
  };

  // ── Carga de datos ────────────────────────────────────────────

  const cargarRecomendaciones = async () => {
    try {
      const response = await api.get("/recomendaciones");
      const recomendaciones = response.data.data || [];

      const recomendacionesConPrecio = await Promise.all(
        recomendaciones.map(async (proveedor) => {
          try {
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: { id_proveedor: proveedor.id_proveedor, limite: 100 },
            });
            const servicios = serviciosResponse.data.data || [];
            const serviciosProveedor = servicios.filter(
              (s) => s.id_proveedor === proveedor.id_proveedor,
            );
            let precioMinimo = null;
            if (serviciosProveedor.length > 0) {
              precioMinimo = Math.min(
                ...serviciosProveedor.map((s) => parseFloat(s.precio) || 0),
              );
            }
            return {
              ...proveedor,
              precio_minimo: precioMinimo,
              calificacion_promedio: proveedor.calificacion_promedio || 0,
            };
          } catch (error) {
            console.error(`Error al cargar servicios del proveedor ${proveedor.id_proveedor}:`, error);
            return { ...proveedor, precio_minimo: null, calificacion_promedio: proveedor.calificacion_promedio || 0 };
          }
        }),
      );

      setProveedores(recomendacionesConPrecio);
    } catch (error) {
      console.error("Error al cargar recomendaciones:", error);
      await cargarProveedoresDestacados();
      setMostrandoRecomendaciones(false);
    }
  };

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

  const cargarCiudades = async () => {
    try {
      const response = await api.get("/lugar");
      setCiudades(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
      setCiudades([]);
    }
  };

  const cargarTiposEventos = async () => {
    try {
      const response = await api.get("/tipos-eventos");
      setTiposEventos(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar tipos de eventos:", error);
      setTiposEventos([]);
    }
  };

  const cargarProveedoresDestacados = async () => {
    try {
      setCargandoProveedores(true);
      const response = await clienteService.buscarProveedores({});
      const proveedoresData = response.data.data || [];

      const proveedoresConPrecio = await Promise.all(
        proveedoresData.map(async (proveedor) => {
          try {
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: { id_proveedor: proveedor.id_proveedor, limite: 100 },
            });
            const servicios = serviciosResponse.data.data || [];
            const serviciosProveedor = servicios.filter(
              (s) => s.id_proveedor === proveedor.id_proveedor,
            );
            let precioMinimo = null;
            if (serviciosProveedor.length > 0) {
              precioMinimo = Math.min(
                ...serviciosProveedor.map((s) => parseFloat(s.precio) || 0),
              );
            }
            return { ...proveedor, precio_minimo: precioMinimo };
          } catch (error) {
            console.error(`Error al cargar servicios del proveedor ${proveedor.id_proveedor}:`, error);
            return { ...proveedor, precio_minimo: null };
          }
        }),
      );

      setProveedores(proveedoresConPrecio);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
      setProveedores([]);
    } finally {
      setCargandoProveedores(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────

  const toggleFavorito = async (e, idProveedor) => {
    e.stopPropagation();

    if (!user || user.rol !== "cliente") {
      navigate("/login", {
        state: { message: "Inicia sesión como cliente para guardar favoritos" },
      });
      return;
    }

    if (procesandoFavorito) return;

    try {
      setProcesandoFavorito(true);
      const esFavorito = favoritos[idProveedor];

      if (esFavorito) {
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
        navigate("/login", {
          state: { message: "Tu sesión ha expirado. Inicia sesión nuevamente" },
        });
      } else {
        alert("Error al actualizar favoritos");
      }
    } finally {
      setProcesandoFavorito(false);
    }
  };

  const handleBuscar = () => {
    const params = new URLSearchParams();
    if (filtros.nombre_proveedor) params.append("nombre_proveedor", filtros.nombre_proveedor);
    if (filtros.ubicacion)        params.append("ciudad", filtros.ubicacion);
    if (filtros.fecha)            params.append("fecha", filtros.fecha);

    if (user && user.rol === "cliente") {
      navigate(`/cliente/explorar?${params.toString()}`);
    } else {
      navigate("/login", {
        state: {
          redirectTo: `/cliente/explorar?${params.toString()}`,
          message: "Inicia sesión para buscar proveedores",
        },
      });
    }
  };

  const handleChangeFiltro = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({ ...prev, [name]: value }));
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

  const getPuntuacionColor = (puntuacion) => {
    if (puntuacion >= 0.8) return "#27ae60";
    if (puntuacion >= 0.6) return "#f39c12";
    return "#95a5a6";
  };

  const handleTipoEventoClick = (tipoEvento) => {
    const params = new URLSearchParams();
    params.append("tipo_evento", tipoEvento.nombre_evento);

    if (user && user.rol === "cliente") {
      navigate(`/cliente/explorar?${params.toString()}`);
    } else {
      navigate("/login", {
        state: {
          redirectTo: `/cliente/explorar?${params.toString()}`,
          message: "Inicia sesión para ver proveedores",
        },
      });
    }
  };

  const handleVerPerfil = (idProveedor) => {
    navigate(`/perfil-proveedor/${idProveedor}`);
  };

  const irAPreferencias = () => {
    navigate("/cliente/cuenta/preferencias");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────

  return (
    <Layout showNav={true}>
      <div className="home-container">

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Encuentra los Proveedores Perfectos para tu Evento en la ZMG
            </h1>

            <div className="search-container">
              <div className="search-input-group">
                <input
                  type="text"
                  name="nombre_proveedor"
                  className="search-input"
                  placeholder="Nombre del proveedor"
                  value={filtros.nombre_proveedor}
                  onChange={handleChangeFiltro}
                />
              </div>

              <div className="search-input-group">
                <select
                  name="ubicacion"
                  className="search-input form-select"
                  value={filtros.ubicacion}
                  onChange={handleChangeFiltro}
                  style={{ color: filtros.ubicacion === "" ? "#adb5bd" : "#495057" }}
                >
                  <option value="" disabled hidden>Ubicación</option>
                  {ciudades.map((lugar) => (
                    <option key={lugar.id_lugar} value={lugar.ciudad}>
                      {lugar.ciudad}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-input-group">
                <input
                  type="date"
                  name="fecha"
                  placeholder="Fecha"
                  value={filtros.fecha}
                  onChange={handleChangeFiltro}
                  className="search-input"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <button onClick={handleBuscar} className="btn-buscar">
                Buscar
              </button>
            </div>
          </div>
        </section>

        {/* Tipos de eventos */}
        <section className="categorias-section">
          <h2>Explora por tipo de evento</h2>
          <div className="categorias-grid">
            {tiposEventos.map((tipoEvento) => (
              <div
                key={tipoEvento.id_tipo_evento}
                className="categoria-card"
                onClick={() => handleTipoEventoClick(tipoEvento)}
              >
                <div className="categoria-icon">
                  {tipoEvento.icono ? tipoEvento.icono : <MdCelebration />}
                </div>
                <h3>{tipoEvento.nombre_evento}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Proveedores */}
        <section className="proveedores-destacados">
          <div className="seccion-header">
            <div className="seccion-titulo-wrapper">
              <h2>
                {mostrandoRecomendaciones ? (
                  <>
                    <FaStar style={{ marginRight: "8px", color: "#f39c12" }} />
                    Recomendaciones Personalizadas para Ti
                  </>
                ) : (
                  "Proveedores Mejor Calificados"
                )}
              </h2>
              {mostrandoRecomendaciones && (
                <p className="seccion-subtitulo">
                  Basadas en tus preferencias de eventos y servicios
                </p>
              )}
            </div>

            {user && user.rol === "cliente" && (
              <button onClick={irAPreferencias} className="btn-preferencias-home">
                {tienePreferencias ? (
                  <><FaCog style={{ marginRight: "6px" }} />Ajustar preferencias</>
                ) : (
                  <><FaMagic style={{ marginRight: "6px" }} />Configurar preferencias</>
                )}
              </button>
            )}
          </div>

          {cargandoProveedores ? (
            <div className="loading-proveedores">
              <p>Cargando proveedores...</p>
            </div>
          ) : (
            <>
              <div className="proveedores-carousel">
                {proveedores.length === 0 ? (
                  <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#6c757d" }}>
                    {mostrandoRecomendaciones
                      ? "No encontramos proveedores que coincidan con tus preferencias. Intenta ajustarlas."
                      : "No hay proveedores disponibles en este momento."}
                  </p>
                ) : (
                  paginados.map((proveedor) => {
                    const calificacion = parseFloat(proveedor.calificacion_promedio) || 0;
                    const calificacionDe5 = calificacion * 5;
                    const esFavorito = !!favoritos[proveedor.id_proveedor];

                    return (
                      <div
                        key={proveedor.id_proveedor}
                        className="proveedor-card-home"
                        onClick={() => handleVerPerfil(proveedor.id_proveedor)}
                        style={{ cursor: "pointer" }}
                      >
                        {mostrandoRecomendaciones && proveedor.puntuacion_recomendacion && (
                          <div
                            className="badge-coincidencia-home"
                            style={{ backgroundColor: getPuntuacionColor(proveedor.puntuacion_recomendacion) }}
                          >
                            <FaSlidersH style={{ marginRight: "4px", fontSize: "10px" }} />
                            {Math.round(proveedor.puntuacion_recomendacion * 100)}% match
                          </div>
                        )}

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
                            onClick={(e) => toggleFavorito(e, proveedor.id_proveedor)}
                            disabled={procesandoFavorito}
                            title={esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"}
                          >
                            {esFavorito ? "♥" : "♡"}
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
                  })
                )}
              </div>

              {/* Paginación */}
              <nav className="hs-paginacion">
                <button
                  className="hs-pag-btn hs-pag-nav"
                  onClick={() => irAPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  aria-label="Página anterior"
                >
                  <FaChevronLeft />
                </button>

                {getPaginas().map((n, i) =>
                  n === "..." ? (
                    <span key={`ellipsis-${i}`} className="hs-pag-ellipsis">…</span>
                  ) : (
                    <button
                      key={n}
                      className={`hs-pag-btn ${paginaActual === n ? "hs-pag-activa" : ""}`}
                      onClick={() => irAPagina(n)}
                      disabled={totalPaginas === 1}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  className="hs-pag-btn hs-pag-nav"
                  onClick={() => irAPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  aria-label="Página siguiente"
                >
                  <FaChevronRight />
                </button>
              </nav>
            </>
          )}
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>TU EVENTO IDEAL EMPIEZA AQUÍ</h2>
            {!user && (
              <div className="cta-buttons">
                <Link to="/register" className="btn-cta btn-registrarse">REGISTRARSE</Link>
                <Link to="/login"    className="btn-cta btn-acceder">ACCEDER</Link>
              </div>
            )}
          </div>
        </section>

      </div>
    </Layout>
  );
}

export default Home;