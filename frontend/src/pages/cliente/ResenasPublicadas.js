import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaStar, FaStarHalfAlt, FaRegStar,
  FaEdit, FaTrashAlt, FaEye, FaCalendarAlt,
  FaChartBar, FaSmile, FaMeh, FaFrown,
  FaThumbsUp, FaSearch, FaInbox, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaSpinner, FaRedo,
  FaFilter, FaSortAmountDown,
} from "react-icons/fa";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import api from "../../services/api";
import "./ResenasPublicadas.css";

const POR_PAGINA = 10;

function ResenasPublicadas() {
  const [resenas, setResenas]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [eliminando, setEliminando]         = useState(null);
  const [filtroSentimiento, setFiltroSentimiento] = useState("todos");
  const [ordenResenas, setOrdenResenas]     = useState("recientes");
  const [paginaActual, setPaginaActual]     = useState(1);

  const navigate = useNavigate();

  useEffect(() => { cargarResenas(); }, []);

  // Reinicia página cuando cambia filtro u orden
  useEffect(() => { setPaginaActual(1); }, [filtroSentimiento, ordenResenas]);

  const cargarResenas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/resenas/mis-resenas");
      setResenas(response.data.data || []);
    } catch (err) {
      console.error("Error al cargar reseñas:", err);
      setError("Error al cargar tus reseñas");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado y paginación ─────────────────────────────────────────────────

  const obtenerSentimiento = (calificacion) => {
    const cal = parseFloat(calificacion || 0);
    if (cal >= 0.625) return "positivo";
    if (cal <= 0.375) return "negativo";
    return "neutro";
  };

  const contarPorSentimiento = (sentimiento) => {
    if (sentimiento === "todos") return resenas.length;
    return resenas.filter(
      (r) => obtenerSentimiento(r.calificacion) === sentimiento
    ).length;
  };

  const obtenerResenasFiltradas = () => {
    let filtradas = [...resenas];

    if (filtroSentimiento !== "todos") {
      filtradas = filtradas.filter(
        (r) => obtenerSentimiento(r.calificacion) === filtroSentimiento
      );
    }

    if (ordenResenas === "mejores") {
      filtradas.sort((a, b) => parseFloat(b.calificacion || 0) - parseFloat(a.calificacion || 0));
    } else if (ordenResenas === "peores") {
      filtradas.sort((a, b) => parseFloat(a.calificacion || 0) - parseFloat(b.calificacion || 0));
    } else {
      filtradas.sort((a, b) => {
        const fa = new Date(a.fecha_creacion || a.fecha_publicacion);
        const fb = new Date(b.fecha_creacion || b.fecha_publicacion);
        return fb - fa;
      });
    }

    return filtradas;
  };

  const todasFiltradas   = obtenerResenasFiltradas();
  const totalPaginas     = Math.ceil(todasFiltradas.length / POR_PAGINA);
  const inicio           = (paginaActual - 1) * POR_PAGINA;
  const resenasPagina    = todasFiltradas.slice(inicio, inicio + POR_PAGINA);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Acciones ──────────────────────────────────────────────────────────────

  const handleEliminarResena = async (id_resena, nombreProveedor) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar tu reseña de "${nombreProveedor}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      setEliminando(id_resena);
      await api.delete(`/resenas/${id_resena}`);
      setResenas((prev) => prev.filter((r) => r.id_resena !== id_resena));
    } catch (error) {
      console.error("Error al eliminar reseña:", error);
      alert(error.response?.data?.message || "Error al eliminar la reseña. Por favor intenta de nuevo.");
    } finally {
      setEliminando(null);
    }
  };

  const handleVerProveedor = (id_proveedor) => navigate(`/perfil-proveedor/${id_proveedor}`);

  // ── Helpers de UI ─────────────────────────────────────────────────────────

  const renderEstrellas = (calificacion) => {
    const valor = parseFloat(calificacion || 0) * 5;
    return Array.from({ length: 5 }, (_, i) => {
      const pos = i + 1;
      if (valor >= pos)       return <FaStar key={pos}         className="estrella estrella-llena" />;
      if (valor >= pos - 0.5) return <FaStarHalfAlt key={pos} className="estrella estrella-media" />;
      return                         <FaRegStar key={pos}      className="estrella estrella-vacia" />;
    });
  };

  const getBadgeInfo = (sentimiento) => {
    switch (sentimiento?.toLowerCase()) {
      case "positivo": return { clase: "badge-positivo", texto: "Positiva",       icono: <FaSmile /> };
      case "neutro":   return { clase: "badge-neutro",   texto: "Neutral",         icono: <FaMeh />   };
      case "negativo": return { clase: "badge-negativo", texto: "Negativa",        icono: <FaFrown /> };
      default:         return { clase: "badge-neutro",   texto: "Sin clasificar",  icono: <FaMeh />   };
    }
  };

  const formatearFecha = (fecha) =>
    new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  // ── Renderizado condicional ───────────────────────────────────────────────

  if (loading) {
    return (
      <ClienteLayout>
        <div className="resenas-publicadas-container">
          <div className="loading-container">
            <FaSpinner className="spinner-icon spin" />
            <p>Cargando tus reseñas...</p>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  if (error) {
    return (
      <ClienteLayout>
        <div className="resenas-publicadas-container">
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <h3>{error}</h3>
            <button onClick={cargarResenas} className="btn-reintentar">
              <FaRedo /> Reintentar
            </button>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  // ── Renderizado principal ─────────────────────────────────────────────────

  return (
    <ClienteLayout>
      <div className="resenas-publicadas-container">

        {/* Header */}
        <div className="resenas-header">
          <div className="resenas-header-titulo">
            <FaEdit className="header-icon" />
            <div>
              <h1>Mis Reseñas Publicadas</h1>
              <p className="resenas-subtitle">
                Aquí puedes ver todas las reseñas que has dejado a los proveedores
              </p>
            </div>
          </div>
        </div>

        {resenas.length === 0 ? (
          <div className="empty-state">
            <FaInbox className="empty-icon" />
            <h3>No has publicado reseñas aún</h3>
            <p>Las reseñas que publiques después de contratar servicios aparecerán aquí</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="resenas-info">
              <FaChartBar className="info-icon" />
              <p>
                Has publicado <strong>{resenas.length}</strong>{" "}
                {resenas.length === 1 ? "reseña" : "reseñas"}
              </p>
            </div>

            {/* Controles de filtrado */}
            <div className="resenas-controles">
              <div className="filtro-sentimiento">
                <FaFilter className="filtro-icon" />
                <button
                  className={`btn-filtro ${filtroSentimiento === "todos" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("todos")}
                >
                  <FaThumbsUp /> Todas ({contarPorSentimiento("todos")})
                </button>
                <button
                  className={`btn-filtro btn-positivo ${filtroSentimiento === "positivo" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("positivo")}
                >
                  <FaSmile /> Positivas ({contarPorSentimiento("positivo")})
                </button>
                <button
                  className={`btn-filtro btn-neutro ${filtroSentimiento === "neutro" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("neutro")}
                >
                  <FaMeh /> Neutras ({contarPorSentimiento("neutro")})
                </button>
                <button
                  className={`btn-filtro btn-negativo ${filtroSentimiento === "negativo" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("negativo")}
                >
                  <FaFrown /> Negativas ({contarPorSentimiento("negativo")})
                </button>
              </div>

              <div className="filtro-ordenamiento">
                <FaSortAmountDown className="filtro-icon" />
                <label>Ordenar por:</label>
                <select
                  value={ordenResenas}
                  onChange={(e) => setOrdenResenas(e.target.value)}
                  className="select-ordenamiento"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="mejores">Mejor calificadas</option>
                  <option value="peores">Peor calificadas</option>
                </select>
              </div>
            </div>

            {/* Lista o vacío filtrado */}
            {todasFiltradas.length === 0 ? (
              <div className="empty-state">
                <FaSearch className="empty-icon" />
                <h3>Sin resultados</h3>
                <p>No hay reseñas que coincidan con los filtros seleccionados</p>
              </div>
            ) : (
              <>
                {/* Indicador de página */}
                <div className="paginacion-info">
                  <p>
                    Mostrando <strong>{inicio + 1}–{Math.min(inicio + POR_PAGINA, todasFiltradas.length)}</strong> de{" "}
                    <strong>{todasFiltradas.length}</strong> reseñas
                  </p>
                </div>

                <div className="resenas-list">
                  {resenasPagina.map((resena) => {
                    const badge    = getBadgeInfo(resena.sentimiento);
                    const valorDe5 = (parseFloat(resena.calificacion) * 5).toFixed(1);

                    return (
                      <div key={resena.id_resena} className="resena-proveedor-card">
                        <div className="resena-header">
                          <div className="resena-info-principal">
                            <h3
                              className="proveedor-nombre-link"
                              onClick={() => handleVerProveedor(resena.id_proveedor)}
                            >
                              {resena.nombre_negocio}
                            </h3>
                            <p className="resena-fecha">
                              <FaCalendarAlt className="fecha-icon" />
                              {formatearFecha(resena.fecha_creacion)}
                            </p>
                          </div>

                          <span className={`badge ${badge.clase}`}>
                            {badge.icono} {badge.texto}
                          </span>
                        </div>

                        <div className="resena-calificacion-grande">
                          <div className="estrellas">{renderEstrellas(resena.calificacion)}</div>
                          <span className="calificacion-numero">{valorDe5}/5.0</span>
                        </div>

                        <div className="resena-comentario">
                          <p>{resena.comentario}</p>
                        </div>

                        <div className="resena-footer">
                          <button
                            onClick={() => handleVerProveedor(resena.id_proveedor)}
                            className="btn-ver-proveedor"
                          >
                            <FaEye /> Ver perfil del proveedor
                          </button>

                          <button
                            onClick={() => handleEliminarResena(resena.id_resena, resena.nombre_negocio)}
                            className="btn-eliminar-resena"
                            disabled={eliminando === resena.id_resena}
                          >
                            {eliminando === resena.id_resena
                              ? <><FaSpinner className="spin" /> Eliminando...</>
                              : <><FaTrashAlt /> Eliminar reseña</>}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <div className="paginacion">
                    <button
                      className="btn-pagina btn-pagina-nav"
                      onClick={() => irAPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      <FaChevronLeft />
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        className={`btn-pagina ${paginaActual === n ? "activa" : ""}`}
                        onClick={() => irAPagina(n)}
                      >
                        {n}
                      </button>
                    ))}

                    <button
                      className="btn-pagina btn-pagina-nav"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ClienteLayout>
  );
}

export default ResenasPublicadas;