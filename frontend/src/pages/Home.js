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
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [favoritos, setFavoritos] = useState({}); // {id_proveedor: id_lista_proveedor}
  const [procesandoFavorito, setProcesandoFavorito] = useState(false);
  const [filtros, setFiltros] = useState({
    nombre_proveedor: "",
    ubicacion: "",
    fecha: "",
  });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    cargarProveedoresDestacados();
    cargarCategorias();
    cargarCiudades();
  }, []);

  useEffect(() => {
    // Cargar favoritos solo si es cliente autenticado
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
      setCategorias([]);
    }
  };

  const cargarProveedoresDestacados = async () => {
    try {
      const response = await clienteService.buscarProveedores({ limite: 6 });
      const proveedoresData = response.data.data || [];

      // Para cada proveedor, obtener su precio mínimo
      const proveedoresConPrecio = await Promise.all(
        proveedoresData.map(async (proveedor) => {
          try {
            // Buscar servicios del proveedor
            const serviciosResponse = await api.get("/servicios/buscar", {
              params: {
                id_proveedor: proveedor.id_proveedor,
                limite: 100,
              },
            });

            const servicios = serviciosResponse.data.data || [];

            // Filtrar solo servicios de este proveedor
            const serviciosProveedor = servicios.filter(
              (s) => s.id_proveedor === proveedor.id_proveedor,
            );

            // Encontrar el precio mínimo
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
    }
  };

  const toggleFavorito = async (e, idProveedor) => {
    e.stopPropagation();

    // Verificar si está autenticado como cliente
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
        // Eliminar de favoritos
        await clienteService.eliminarDeFavoritos(favoritos[idProveedor]);
        
        // Actualizar estado local
        setFavoritos((prev) => {
          const newFavoritos = { ...prev };
          delete newFavoritos[idProveedor];
          return newFavoritos;
        });
      } else {
        // Agregar a favoritos
        const response = await clienteService.agregarAFavoritos(idProveedor);
        
        // Actualizar estado local
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
    // Construir parámetros de búsqueda
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

    // Si está autenticado como cliente, ir directamente a explorar
    if (user && user.rol === "cliente") {
      navigate(`/cliente/explorar?${params.toString()}`);
    } else {
      // Si no está autenticado, ir a explorar público o pedir login
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
    // Convertir calificación de 0-1 a 0-5
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;

    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        // Estrella completa
        estrellas.push(<FaStar key={i} className="estrella-llena-home" />);
      } else if (calificacionEstrellas >= i - 0.5) {
        // Media estrella
        estrellas.push(
          <FaStarHalfAlt key={i} className="estrella-media-home" />,
        );
      } else {
        // Estrella vacía
        estrellas.push(<FaRegStar key={i} className="estrella-vacia-home" />);
      }
    }

    return estrellas;
  };

  const handleCategoriaClick = (categoria) => {
    const params = new URLSearchParams();
    params.append("tipo_servicio", categoria.nombre_categoria);

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

  // Función para navegar al perfil del proveedor
  const handleVerPerfil = (idProveedor) => {
    navigate(`/perfil-proveedor/${idProveedor}`);
  };

  // Mostrar loading mientras verifica autenticación
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
                  className="search-input "
                  placeholder="Nombre"
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
                />
              </div>

              <button onClick={handleBuscar} className="btn-buscar">
                Buscar
              </button>
            </div>
          </div>
        </section>

        {/* Categorías de eventos */}
        <section className="categorias-section">
          <h2>Explora por tipo de servicio</h2>
          <div className="categorias-grid">
            {categorias.map((categoria) => (
              <div
                key={categoria.id_categoria}
                className="categoria-card"
                onClick={() => handleCategoriaClick(categoria)}
              >
                <div className="categoria-icon">{categoria.icono || "📋"}</div>
                <h3>{categoria.nombre_categoria}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* Proveedores mejor calificados */}
        <section className="proveedores-destacados">
          <div className="section-header">
            <h2>Proveedores Mejor Calificados</h2>
            <div className="carousel-controls">
              <button className="carousel-btn">←</button>
              <button className="carousel-btn">→</button>
            </div>
          </div>

          <div className="proveedores-carousel">
            {proveedores.length === 0 ? (
              <p
                style={{
                  gridColumn: "1 / -1",
                  textAlign: "center",
                  color: "#6c757d",
                }}
              >
                No hay proveedores disponibles en este momento.
              </p>
            ) : (
              proveedores.slice(0, 3).map((proveedor) => {
                // Convertir calificación de 0-1 a 0-5
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