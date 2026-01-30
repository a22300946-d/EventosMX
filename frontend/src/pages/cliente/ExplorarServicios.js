import React, { useState, useEffect } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import Layout from "../../components/Layout";
import { clienteService } from "../../services/clienteService";
import api from "../../services/api";
import "./ExplorarServicios.css";

function ExplorarServicios() {
  const navigate = useNavigate();
  const [proveedores, setProveedores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const [filtros, setFiltros] = useState({
    nombre_proveedor: "",
    tipo_servicio: "",
    ciudad: "",
    fecha: "",
    precio_max: "",
  });

  const [loading, setLoading] = useState(true);

  const [paginaActual, setPaginaActual] = useState(1);
  const proveedoresPorPagina = 6;

  useEffect(() => {
    // Cargar categorías y ciudades solo una vez
    if (categorias.length === 0) {
      cargarCategorias();
    }
    if (ciudades.length === 0) {
      cargarCiudades();
    }

    // Actualizar filtros desde la URL y buscar
    const nuevosFiltros = {
      nombre_proveedor: searchParams.get("nombre_proveedor") || "",
      tipo_servicio: searchParams.get("tipo_servicio") || "",
      ciudad: searchParams.get("ciudad") || "",
      fecha: searchParams.get("fecha") || "",
      precio_max: searchParams.get("precio_max") || "",
    };

    setFiltros(nuevosFiltros);

    // Ejecutar búsqueda con los nuevos filtros directamente
    buscarConFiltros(nuevosFiltros);
  }, [searchParams]);

  const buscarConFiltros = async (filtrosParaBuscar) => {
    try {
      setLoading(true);

      const filtrosAPI = {};
      let hayFiltrosActivos = false;

      if (
        filtrosParaBuscar.nombre_proveedor &&
        filtrosParaBuscar.nombre_proveedor.trim() !== ""
      ) {
        filtrosAPI.nombre_proveedor = filtrosParaBuscar.nombre_proveedor;
        hayFiltrosActivos = true;
      }

      if (
        filtrosParaBuscar.tipo_servicio &&
        filtrosParaBuscar.tipo_servicio.trim() !== ""
      ) {
        filtrosAPI.tipo_servicio = filtrosParaBuscar.tipo_servicio;
        hayFiltrosActivos = true;
      }

      if (filtrosParaBuscar.ciudad && filtrosParaBuscar.ciudad.trim() !== "") {
        filtrosAPI.ciudad = filtrosParaBuscar.ciudad;
        hayFiltrosActivos = true;
      }

      // Si no hay filtros, cargar todos los proveedores
      if (!hayFiltrosActivos && !filtrosParaBuscar.precio_max) {
        filtrosAPI.limite = 100;
      }

      const response = await clienteService.buscarProveedores(filtrosAPI);
      const proveedoresData = response.data.data || [];

      // Filtrar exactamente por tipo_servicio
      let proveedoresFiltradosPorTipo = proveedoresData;
      if (
        filtrosParaBuscar.tipo_servicio &&
        filtrosParaBuscar.tipo_servicio.trim() !== ""
      ) {
        proveedoresFiltradosPorTipo = proveedoresData.filter((proveedor) => {
          return (
            proveedor.tipo_servicio &&
            proveedor.tipo_servicio.toLowerCase() ===
              filtrosParaBuscar.tipo_servicio.toLowerCase()
          );
        });
      }

      // Para cada proveedor, obtener su precio mínimo
      const proveedoresConPrecio = await Promise.all(
        proveedoresFiltradosPorTipo.map(async (proveedor) => {
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
              const precios = serviciosProveedor
                .map((s) => parseFloat(s.precio))
                .filter((p) => !isNaN(p) && p > 0);

              if (precios.length > 0) {
                precioMinimo = Math.min(...precios);
              }
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

      // Filtrar por precio máximo
      let proveedoresFiltrados = proveedoresConPrecio;

      if (filtrosParaBuscar.precio_max && filtrosParaBuscar.precio_max > 0) {
        proveedoresFiltrados = proveedoresConPrecio.filter((proveedor) => {
          return (
            proveedor.precio_minimo !== null &&
            proveedor.precio_minimo <= parseFloat(filtrosParaBuscar.precio_max)
          );
        });
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

  // Mantén la función original que usa el estado
  const buscarProveedores = () => {
    buscarConFiltros(filtros);
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

  const cargarCategorias = async () => {
    try {
      const response = await clienteService.obtenerCategorias();
      setCategorias(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const handleChangeFiltro = (e) => {
    setFiltros({
      ...filtros,
      [e.target.name]: e.target.value,
    });
  };

  const handleBuscar = () => {
    // Limpiar la URL y actualizar con los filtros actuales
    const params = new URLSearchParams();

    if (filtros.nombre_proveedor && filtros.nombre_proveedor.trim() !== "") {
      params.append("nombre_proveedor", filtros.nombre_proveedor);
    }

    if (filtros.tipo_servicio && filtros.tipo_servicio.trim() !== "") {
      params.append("tipo_servicio", filtros.tipo_servicio);
    }

    if (filtros.ciudad && filtros.ciudad.trim() !== "") {
      params.append("ciudad", filtros.ciudad);
    }

    if (filtros.fecha && filtros.fecha.trim() !== "") {
      params.append("fecha", filtros.fecha);
    }

    if (filtros.precio_max && filtros.precio_max > 0) {
      // ← AGREGAR ESTO
      params.append("precio_max", filtros.precio_max);
    }

    // Actualizar la URL (esto disparará el useEffect que busca proveedores)
    navigate(`/cliente/explorar?${params.toString()}`, { replace: true });
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      nombre_proveedor: "",
      tipo_servicio: "",
      ciudad: "",
      precio_max: "",
      fecha: "",
    });
    navigate("/cliente/explorar", { replace: true });
  };

  const handleCategoriaClick = (categoria) => {
    const params = new URLSearchParams();
    params.append("tipo_servicio", categoria.nombre_categoria);
    navigate(`/cliente/explorar?${params.toString()}`, { replace: true });
  };

  const handleVerPerfil = (idProveedor) => {
    navigate(`/perfil-proveedor/${idProveedor}`);
  };

  // Función para renderizar estrellas dinámicas
  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;

    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        estrellas.push(<FaStar key={i} className="estrella-llena" />);
      } else if (calificacionEstrellas >= i - 0.5) {
        estrellas.push(<FaStarHalfAlt key={i} className="estrella-media" />);
      } else {
        estrellas.push(<FaRegStar key={i} className="estrella-vacia" />);
      }
    }

    return estrellas;
  };

  // Calcular proveedores para la página actual
  const indiceUltimo = paginaActual * proveedoresPorPagina;
  const indicePrimero = indiceUltimo - proveedoresPorPagina;
  const proveedoresActuales = proveedores.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(proveedores.length / proveedoresPorPagina);

  // Funciones de navegación
  const irPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const irPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Layout>
      <div className="explorar-container">
        {/* Buscador */}
        <div className="search-section">
          <h1>Encuentra los Proveedores Perfectos para tu Evento en la ZMG</h1>
          <div className="search-bar">
            <input
              type="text"
              name="nombre_proveedor"
              placeholder="Nombre"
              value={filtros.nombre_proveedor}
              onChange={handleChangeFiltro}
              className="search-input"
            />

            <select
              name="ciudad"
              className="search-input form-select"
              value={filtros.ciudad}
              onChange={handleChangeFiltro}
              style={{
                color: filtros.ciudad === "" ? "#adb5bd" : "#495057",
              }}
            >
              <option value="" disabled hidden>
                Ciudad
              </option>

              {ciudades.map((lugar) => (
                <option key={lugar.id_lugar} value={lugar.ciudad}>
                  {lugar.ciudad}
                </option>
              ))}
            </select>

            <input
              type="number"
              name="precio_max"
              placeholder="Precio máximo"
              value={filtros.precio_max}
              onChange={handleChangeFiltro}
              className="search-input"
            />

            <button onClick={handleBuscar} className="btn-buscar">
              Buscar
            </button>

            <button
              onClick={handleLimpiarFiltros}
              className="btn-limpiar"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Categorías de eventos */}
        <section className="categorias-section">
          <h2>Explora por tipo de evento</h2>
          <div className="categorias-grid">
            {categorias.length > 0 ? (
              categorias.map((categoria) => (
                <div
                  key={categoria.id_categoria}
                  className={`categoria-card ${
                    filtros.tipo_servicio === categoria.nombre_categoria
                      ? "categoria-activa"
                      : ""
                  }`}
                  onClick={() => handleCategoriaClick(categoria)}
                >
                  <div className="categoria-icon">
                    {categoria.icono || "📋"}
                  </div>
                  <h3>{categoria.nombre_categoria}</h3>
                </div>
              ))
            ) : (
              <p
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#6c757d",
                }}
              >
                No hay categorías disponibles por el momento.
              </p>
            )}
          </div>
        </section>

        {/* Resultados de búsqueda */}
        <section className="proveedores-section">
          <div className="section-header">
            <h2>
              {filtros.nombre_proveedor ||
              filtros.tipo_servicio ||
              filtros.ciudad
                ? "Resultados de búsqueda"
                : "Proveedores Mejor Calificados"}
            </h2>
            {proveedores.length > proveedoresPorPagina && (
              <div className="carousel-controls">
                <button
                  className="carousel-btn"
                  onClick={irPaginaAnterior}
                  disabled={paginaActual === 1}
                  style={{
                    opacity: paginaActual === 1 ? 0.5 : 1,
                    cursor: paginaActual === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ←
                </button>
                <span
                  style={{
                    margin: "0 1rem",
                    color: "#1a4d5c",
                    fontWeight: "500",
                  }}
                >
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  className="carousel-btn"
                  onClick={irPaginaSiguiente}
                  disabled={paginaActual === totalPaginas}
                  style={{
                    opacity: paginaActual === totalPaginas ? 0.5 : 1,
                    cursor:
                      paginaActual === totalPaginas ? "not-allowed" : "pointer",
                  }}
                >
                  →
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <p>Buscando proveedores...</p>
          ) : proveedores.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>
              <p style={{ fontSize: "1.2rem", color: "#6c757d" }}>
                No se encontraron proveedores con estos filtros.
              </p>
              <button
                onClick={handleLimpiarFiltros}
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem 2rem",
                  backgroundColor: "#1a4d5c",
                  color: "white",
                  border: "none",
                  borderRadius: "25px",
                  cursor: "pointer",
                }}
              >
                Ver todos los proveedores
              </button>
            </div>
          ) : (
            <div className="proveedores-grid">
              {proveedoresActuales.map((proveedor) => {
                const calificacion =
                  parseFloat(proveedor.calificacion_promedio) || 0;
                const calificacionDe5 = calificacion * 5;

                return (
                  <div
                    key={proveedor.id_proveedor}
                    className="proveedor-card"
                    onClick={() => handleVerPerfil(proveedor.id_proveedor)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="proveedor-image">
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
                        className="btn-favorito"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Agregado a favoritos");
                        }}
                      >
                        ♡
                      </button>
                    </div>

                    <div className="proveedor-info">
                      <div className="proveedor-rating">
                        {renderEstrellas(calificacion)}
                        <span className="rating-numero">
                          {calificacionDe5.toFixed(1)}/5
                        </span>
                      </div>

                      <h3>{proveedor.nombre_negocio}</h3>

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

                      <div className="proveedor-footer">
                        <span className="categoria-badge">
                          {proveedor.tipo_servicio}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

export default ExplorarServicios;
