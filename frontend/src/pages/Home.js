import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { clienteService } from "../services/clienteService";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import "./Home.css";

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
  // ⭐ NUEVO: Estados para recomendaciones
  const [tienePreferencias, setTienePreferencias] = useState(false);
  const [mostrandoRecomendaciones, setMostrandoRecomendaciones] = useState(false);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    cargarTiposEventos();
    cargarCiudades();
  }, []);

  // ⭐ NUEVO: Detectar si el usuario tiene preferencias y cargar proveedores
  useEffect(() => {
    if (user && user.rol === "cliente") {
      cargarFavoritos();
      verificarPreferenciasYCargarProveedores();
    } else {
      // Si no hay usuario o no es cliente, mostrar mejor calificados
      cargarProveedoresDestacados();
    }
  }, [user]);

  // ⭐ NUEVA FUNCIÓN: Verificar preferencias y decidir qué mostrar
  const verificarPreferenciasYCargarProveedores = async () => {
    try {
      setCargandoProveedores(true);
      
      // Verificar si tiene preferencias configuradas
      const prefResponse = await api.get("/recomendaciones/preferencias");
      const tienePrefs = prefResponse.data.data !== null;
      
      setTienePreferencias(tienePrefs);

      if (tienePrefs) {
        // Tiene preferencias → Cargar recomendaciones
        await cargarRecomendaciones();
        setMostrandoRecomendaciones(true);
      } else {
        // No tiene preferencias → Cargar mejor calificados
        await cargarProveedoresDestacados();
        setMostrandoRecomendaciones(false);
      }
    } catch (error) {
      console.error("Error al verificar preferencias:", error);
      // Si hay error, mostrar mejor calificados por defecto
      await cargarProveedoresDestacados();
      setMostrandoRecomendaciones(false);
    } finally {
      setCargandoProveedores(false);
    }
  };

  // ⭐ NUEVA FUNCIÓN: Cargar recomendaciones personalizadas
  const cargarRecomendaciones = async () => {
    try {
      const response = await api.get("/recomendaciones?limite=6");
      const recomendaciones = response.data.data || [];

      // Agregar precios mínimos a las recomendaciones
      const recomendacionesConPrecio = await Promise.all(
        recomendaciones.map(async (proveedor) => {
          try {
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: {
                id_proveedor: proveedor.id_proveedor,
                limite: 100,
              },
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
              // ⭐ Asegurar que tenga calificacion_promedio
              calificacion_promedio: proveedor.calificacion_promedio || 0,
            };
          } catch (error) {
            console.error(
              `Error al cargar servicios del proveedor ${proveedor.id_proveedor}:`,
              error,
            );
            return {
              ...proveedor,
              precio_minimo: null,
              calificacion_promedio: proveedor.calificacion_promedio || 0,
            };
          }
        }),
      );

      setProveedores(recomendacionesConPrecio);
    } catch (error) {
      console.error("Error al cargar recomendaciones:", error);
      // Si falla, cargar mejor calificados como fallback
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
      const response = await clienteService.buscarProveedores({ limite: 6 });
      const proveedoresData = response.data.data || [];

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
            };
          } catch (error) {
            console.error(
              `Error al cargar servicios del proveedor ${proveedor.id_proveedor}:`,
              error,
            );
            return {
              ...proveedor,
              precio_minimo: null,
            };
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

  const toggleFavorito = async (e, idProveedor) => {
    e.stopPropagation();

    if (!user || user.rol !== "cliente") {
      navigate("/login", {
        state: {
          message: "Inicia sesión como cliente para guardar favoritos",
        },
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
          state: {
            message: "Tu sesión ha expirado. Inicia sesión nuevamente",
          },
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

    if (filtros.nombre_proveedor) {
      params.append("nombre_proveedor", filtros.nombre_proveedor);
    }
    if (filtros.ubicacion) {
      params.append("ciudad", filtros.ubicacion);
    }
    if (filtros.fecha) {
      params.append("fecha", filtros.fecha);
    }

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

    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;

    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        estrellas.push(<FaStar key={i} className="estrella-llena-home" />);
      } else if (calificacionEstrellas >= i - 0.5) {
        estrellas.push(
          <FaStarHalfAlt key={i} className="estrella-media-home" />,
        );
      } else {
        estrellas.push(<FaRegStar key={i} className="estrella-vacia-home" />);
      }
    }

    return estrellas;
  };

  // ⭐ NUEVA FUNCIÓN: Obtener color del badge según puntuación
  const getPuntuacionColor = (puntuacion) => {
    if (puntuacion >= 0.8) return "#27ae60"; // Verde
    if (puntuacion >= 0.6) return "#f39c12"; // Naranja
    return "#95a5a6"; // Gris
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

  // ⭐ NUEVA FUNCIÓN: Navegar a preferencias
  const irAPreferencias = () => {
    navigate("/cliente/preferencias");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <Layout showNav={true}>
      <div className="home-container">
        {/* Hero Section con búsqueda */}
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
                  style={{
                    color: filtros.ubicacion === "" ? "#adb5bd" : "#495057",
                  }}
                >
                  <option value="" disabled hidden>
                    Ubicación
                  </option>

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
                <div className="categoria-icon">{tipoEvento.icono || "🎉"}</div>
                <h3>{tipoEvento.nombre_evento}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* ⭐ SECCIÓN MODIFICADA: Proveedores (Recomendaciones o Mejor Calificados) */}
        <section className="proveedores-destacados">
          <div className="seccion-header">
            <div className="seccion-titulo-wrapper">
              <h2>
                {mostrandoRecomendaciones 
                  ? "🌟 Recomendaciones Personalizadas para Ti" 
                  : "Proveedores Mejor Calificados"}
              </h2>
              {mostrandoRecomendaciones && (
                <p className="seccion-subtitulo">
                  Basadas en tus preferencias de eventos y servicios
                </p>
              )}
            </div>
            
            {/* ⭐ Botón de preferencias (solo si es cliente con sesión) */}
            {user && user.rol === "cliente" && (
              <button onClick={irAPreferencias} className="btn-preferencias-home">
                {tienePreferencias ? "⚙️ Ajustar preferencias" : "✨ Configurar preferencias"}
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
                  <p
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      color: "#6c757d",
                    }}
                  >
                    {mostrandoRecomendaciones 
                      ? "No encontramos proveedores que coincidan con tus preferencias. Intenta ajustarlas."
                      : "No hay proveedores disponibles en este momento."}
                  </p>
                ) : (
                  proveedores.slice(0, 3).map((proveedor) => {
                    const calificacion =
                      parseFloat(proveedor.calificacion_promedio) || 0;
                    const calificacionDe5 = calificacion * 5;
                    const esFavorito = !!favoritos[proveedor.id_proveedor];

                    return (
                      <div
                        key={proveedor.id_proveedor}
                        className="proveedor-card-home"
                        onClick={() => handleVerPerfil(proveedor.id_proveedor)}
                        style={{ cursor: "pointer" }}
                      >
                        {/* ⭐ Badge de coincidencia (solo en recomendaciones) */}
                        {mostrandoRecomendaciones && proveedor.puntuacion_recomendacion && (
                          <div 
                            className="badge-coincidencia-home"
                            style={{ 
                              backgroundColor: getPuntuacionColor(proveedor.puntuacion_recomendacion) 
                            }}
                          >
                            {Math.round(proveedor.puntuacion_recomendacion * 100)}% match
                          </div>
                        )}

                        <div className="proveedor-image-home">
                          <img
                            src={
                              proveedor.logo ||
                              "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                            }
                            alt={proveedor.nombre_negocio}
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
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
                            <span className="rating-numero">
                              {calificacionDe5.toFixed(1)}/5
                            </span>
                          </div>

                          <h3>{proveedor.nombre_negocio}</h3>

                          {/* ⭐ NUEVO: Ubicación */}
                          {proveedor.ciudad && (
                            <p className="proveedor-ubicacion-home">
                              📍 {proveedor.ciudad}
                            </p>
                          )}

                          {/* ⭐ NUEVO: Descripción */}
                          {proveedor.descripcion && (
                            <p className="proveedor-descripcion-home">
                              {proveedor.descripcion.length > 80
                                ? `${proveedor.descripcion.substring(0, 80)}...`
                                : proveedor.descripcion}
                            </p>
                          )}

                          {proveedor.precio_minimo !== null &&
                          proveedor.precio_minimo > 0 ? (
                            <p className="proveedor-precio">
                              Desde $
                              {proveedor.precio_minimo.toLocaleString("es-MX")}
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
                  })
                )}
              </div>

              {/* Controles del carousel */}
              <div className="carousel-navigation">
                <button className="carousel-nav-btn" aria-label="Anterior">
                  <span>←</span>
                </button>
                <div className="carousel-dots">
                  <span className="dot active"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <button className="carousel-nav-btn" aria-label="Siguiente">
                  <span>→</span>
                </button>
              </div>
            </>
          )}
        </section>

        {/* Call to Action */}
        <section className="cta-section">
          <div className="cta-content">
            <h2>TU EVENTO IDEAL EMPIEZA AQUÍ</h2>
            {!user && (
              <div className="cta-buttons">
                <Link to="/register" className="btn-cta btn-registrarse">
                  REGISTRARSE
                </Link>
                <Link to="/login" className="btn-cta btn-acceder">
                  ACCEDER
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

export default Home;