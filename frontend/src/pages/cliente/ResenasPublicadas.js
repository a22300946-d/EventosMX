import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import api from "../../services/api";
import "./ResenasPublicadas.css";

function ResenasPublicadas() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  // Estados de filtros (igual que PerfilProveedor)
  const [filtroSentimiento, setFiltroSentimiento] = useState("todos");
  const [ordenResenas, setOrdenResenas] = useState("recientes");

  const navigate = useNavigate();

  useEffect(() => {
    cargarResenas();
  }, []);

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

  // ── Lógica de filtrado (idéntica a PerfilProveedor) ──────────────────────

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
      filtradas.sort(
        (a, b) => parseFloat(b.calificacion || 0) - parseFloat(a.calificacion || 0)
      );
    } else if (ordenResenas === "peores") {
      filtradas.sort(
        (a, b) => parseFloat(a.calificacion || 0) - parseFloat(b.calificacion || 0)
      );
    } else {
      // recientes
      filtradas.sort((a, b) => {
        const fa = new Date(a.fecha_creacion || a.fecha_publicacion);
        const fb = new Date(b.fecha_creacion || b.fecha_publicacion);
        return fb - fa;
      });
    }

    return filtradas;
  };

  // ── Helpers de UI ─────────────────────────────────────────────────────────

  const handleEliminarResena = async (id_resena, nombreProveedor) => {
    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar tu reseña de "${nombreProveedor}"?\n\nEsta acción no se puede deshacer.`
    );
    if (!confirmar) return;

    try {
      setEliminando(id_resena);
      await api.delete(`/resenas/${id_resena}`);
      setResenas((prev) => prev.filter((r) => r.id_resena !== id_resena));
      alert("✅ Reseña eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar reseña:", error);
      alert(
        error.response?.data?.message ||
          "❌ Error al eliminar la reseña. Por favor intenta de nuevo."
      );
    } finally {
      setEliminando(null);
    }
  };

  const handleVerProveedor = (id_proveedor) => {
    navigate(`/perfil-proveedor/${id_proveedor}`);
  };

  const renderEstrellas = (calificacion) => {
    const valor = parseFloat(calificacion || 0) * 5;
    return Array.from({ length: 5 }, (_, i) => {
      const pos = i + 1;
      if (valor >= pos)
        return <FaStar key={pos} className="estrella estrella-llena" />;
      if (valor >= pos - 0.5)
        return <FaStarHalfAlt key={pos} className="estrella estrella-media" />;
      return <FaRegStar key={pos} className="estrella estrella-vacia" />;
    });
  };

  const getBadgeInfo = (sentimiento) => {
    switch (sentimiento?.toLowerCase()) {
      case "positivo": return { clase: "badge-positivo", texto: "Positiva" };
      case "neutro":   return { clase: "badge-neutro",   texto: "Neutral"  };
      case "negativo": return { clase: "badge-negativo", texto: "Negativa" };
      default:         return { clase: "badge-neutro",   texto: "Sin clasificar" };
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
            <div className="spinner"></div>
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
            <span className="error-icon">⚠️</span>
            <h3>{error}</h3>
            <button onClick={cargarResenas} className="btn-reintentar">
              Reintentar
            </button>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  const resenasMostradas = obtenerResenasFiltradas();

  // ── Renderizado principal ─────────────────────────────────────────────────

  return (
    <ClienteLayout>
      <div className="resenas-publicadas-container">

        <div className="resenas-header">
          <h1>📝 Mis Reseñas Publicadas</h1>
          <p className="resenas-subtitle">
            Aquí puedes ver todas las reseñas que has dejado a los proveedores
          </p>
        </div>

        {resenas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <h3>No has publicado reseñas aún</h3>
            <p>Las reseñas que publiques después de contratar servicios aparecerán aquí</p>
          </div>
        ) : (
          <>
            <div className="resenas-info">
              <p>
                📊 Has publicado <strong>{resenas.length}</strong>{" "}
                {resenas.length === 1 ? "reseña" : "reseñas"}
              </p>
            </div>

            {/* ── Controles de filtrado (idénticos a PerfilProveedor) ── */}
            <div className="resenas-controles">
              <div className="filtro-sentimiento">
                <button
                  className={`btn-filtro ${filtroSentimiento === "todos" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("todos")}
                >
                  Todas ({contarPorSentimiento("todos")})
                </button>
                <button
                  className={`btn-filtro btn-positivo ${filtroSentimiento === "positivo" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("positivo")}
                >
                  😊 Positivas ({contarPorSentimiento("positivo")})
                </button>
                <button
                  className={`btn-filtro btn-neutro ${filtroSentimiento === "neutro" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("neutro")}
                >
                  😐 Neutras ({contarPorSentimiento("neutro")})
                </button>
                <button
                  className={`btn-filtro btn-negativo ${filtroSentimiento === "negativo" ? "activo" : ""}`}
                  onClick={() => setFiltroSentimiento("negativo")}
                >
                  😞 Negativas ({contarPorSentimiento("negativo")})
                </button>
              </div>

              <div className="filtro-ordenamiento">
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

            {/* ── Lista filtrada ── */}
            {resenasMostradas.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔍</span>
                <h3>Sin resultados</h3>
                <p>No hay reseñas que coincidan con los filtros seleccionados</p>
              </div>
            ) : (
              <div className="resenas-list">
                {resenasMostradas.map((resena) => {
                  const badge = getBadgeInfo(resena.sentimiento);
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
                            📅 {formatearFecha(resena.fecha_creacion)}
                          </p>
                        </div>

                        <div className="resena-acciones">
                          <span className={`badge ${badge.clase}`}>
                            {badge.texto}
                          </span>
                        </div>
                      </div>

                      <div className="resena-calificacion-grande">
                        <div className="estrellas">
                          {renderEstrellas(resena.calificacion)}
                        </div>
                        <span className="calificacion-numero">
                          {valorDe5}/5.0
                        </span>
                      </div>

                      <div className="resena-comentario">
                        <p>{resena.comentario}</p>
                      </div>

                      <div className="resena-footer">
                        <button
                          onClick={() => handleVerProveedor(resena.id_proveedor)}
                          className="btn-ver-proveedor"
                        >
                          👁️ Ver perfil del proveedor
                        </button>

                        <button
                          onClick={() =>
                            handleEliminarResena(resena.id_resena, resena.nombre_negocio)
                          }
                          className="btn-eliminar-resena"
                          disabled={eliminando === resena.id_resena}
                        >
                          {eliminando === resena.id_resena
                            ? <>⏳ Eliminando...</>
                            : <>🗑️ Eliminar reseña</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ClienteLayout>
  );
}

export default ResenasPublicadas;