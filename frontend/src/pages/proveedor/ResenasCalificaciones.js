import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import "./ResenasCalificaciones.css";
import {
  FaStar, FaStarHalfAlt, FaRegStar,
  FaFlag, FaTimes, FaSmile, FaMeh, FaFrown,
  FaThumbsUp, FaSortAmountDown, FaFilter,
  FaExclamationTriangle, FaBan,
  FaEnvelope, FaEdit, FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

const POR_PAGINA = 10;

function ResenasCalificaciones() {
  const { user } = useAuth();
  const [resenas, setResenas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filtroSentimiento, setFiltroSentimiento] = useState("todos");
  const [ordenResenas, setOrdenResenas] = useState("recientes");
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalReportarAbierto, setModalReportarAbierto] = useState(false);
  const [resenaSeleccionada, setResenaSeleccionada] = useState(null);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  useEffect(() => {
    if (user && user.id_proveedor) cargarResenas();
  }, [user]);

  useEffect(() => { setPaginaActual(1); }, [filtroSentimiento, ordenResenas]);

  const cargarResenas = async () => {
    try {
      setLoading(true);
      if (!user || !user.id_proveedor) return;

      const response = await api.get(`/resenas/proveedor/${user.id_proveedor}`);
      const resenasData = response.data.data || [];

      const resenasOrdenadas = resenasData.sort((a, b) =>
        new Date(b.fecha_resena || b.fecha_publicacion) -
        new Date(a.fecha_resena || a.fecha_publicacion)
      );

      setResenas(resenasOrdenadas);

      if (resenasOrdenadas.length > 0) {
        const total = resenasOrdenadas.length;
        const sumaCalificaciones = resenasOrdenadas.reduce(
          (sum, r) => sum + parseFloat(r.calificacion || 0), 0
        );
        const promedio = sumaCalificaciones / total;
        const positivas = resenasOrdenadas.filter((r) => parseFloat(r.calificacion || 0) >= 0.625).length;
        const negativas = resenasOrdenadas.filter((r) => parseFloat(r.calificacion || 0) <= 0.375).length;
        const neutras = total - positivas - negativas;
        setEstadisticas({ total, promedio: promedio * 5, positivas, neutras, negativas });
      } else {
        setEstadisticas({ total: 0, promedio: 0, positivas: 0, neutras: 0, negativas: 0 });
      }
    } catch (error) {
      console.error("Error al cargar reseñas:", error);
      setResenas([]);
      setEstadisticas({ total: 0, promedio: 0, positivas: 0, neutras: 0, negativas: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado y paginación ────────────────────────────────────────────────

  const obtenerSentimiento = (calificacion) => {
    const cal = parseFloat(calificacion || 0);
    if (cal >= 0.625) return "positivo";
    if (cal <= 0.375) return "negativo";
    return "neutro";
  };

  const contarPorSentimiento = (sentimiento) => {
    if (sentimiento === "todos") return resenas.length;
    return resenas.filter((r) => obtenerSentimiento(r.calificacion) === sentimiento).length;
  };

  const obtenerResenasFiltradas = () => {
    let filtradas = [...resenas];
    if (filtroSentimiento !== "todos")
      filtradas = filtradas.filter((r) => obtenerSentimiento(r.calificacion) === filtroSentimiento);

    if (ordenResenas === "mejores")
      filtradas.sort((a, b) => parseFloat(b.calificacion || 0) - parseFloat(a.calificacion || 0));
    else if (ordenResenas === "peores")
      filtradas.sort((a, b) => parseFloat(a.calificacion || 0) - parseFloat(b.calificacion || 0));
    else
      filtradas.sort((a, b) =>
        new Date(b.fecha_resena || b.fecha_publicacion) -
        new Date(a.fecha_resena || a.fecha_publicacion)
      );

    return filtradas;
  };

  const todasFiltradas  = obtenerResenasFiltradas();
  const totalPaginas    = Math.ceil(todasFiltradas.length / POR_PAGINA);
  const inicio          = (paginaActual - 1) * POR_PAGINA;
  const resenasPagina   = todasFiltradas.slice(inicio, inicio + POR_PAGINA);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Helpers de UI ────────────────────────────────────────────────────────

  const renderEstrellas = (calificacion) => {
    const valor = parseFloat(calificacion || 0) * 5;
    return Array.from({ length: 5 }, (_, i) => {
      const pos = i + 1;
      if (valor >= pos)       return <FaStar key={pos}        className="estrella-llena" />;
      if (valor >= pos - 0.5) return <FaStarHalfAlt key={pos} className="estrella-media" />;
      return                         <FaRegStar key={pos}     className="estrella-vacia" />;
    });
  };

  const getBadge = (calificacion) => {
    const cal = parseFloat(calificacion || 0);
    if (cal >= 0.625) return { class: "sr-badge-aceptada",  text: "Reseña positiva", icono: <FaSmile /> };
    if (cal <= 0.375) return { class: "sr-badge-rechazada", text: "Reseña negativa", icono: <FaFrown /> };
    return                   { class: "sr-badge-pendiente", text: "Reseña neutra",   icono: <FaMeh />   };
  };

  // ── Modal de reportar ────────────────────────────────────────────────────

  const handleAbrirModalReportar = (resena) => {
    setResenaSeleccionada(resena);
    setModalReportarAbierto(true);
    setMotivoReporte("");
    setMotivoPersonalizado("");
  };

  const handleCerrarModal = () => {
    setModalReportarAbierto(false);
    setResenaSeleccionada(null);
    setMotivoReporte("");
    setMotivoPersonalizado("");
  };

  const handleReportarResena = async () => {
    const motivoFinal = motivoReporte === "otro" ? motivoPersonalizado : motivoReporte;
    if (!motivoFinal || motivoFinal.trim() === "") {
      alert("Por favor, selecciona o escribe un motivo para el reporte.");
      return;
    }
    try {
      setEnviandoReporte(true);
      await api.put(`/resenas/${resenaSeleccionada.id_resena}/reportar`, { motivo: motivoFinal.trim() });
      alert("Reseña reportada exitosamente. Nuestro equipo la revisará pronto.");
      handleCerrarModal();
      cargarResenas();
    } catch (error) {
      console.error("Error al reportar reseña:", error);
      alert("Error al reportar la reseña. Por favor, intenta nuevamente.");
    } finally {
      setEnviandoReporte(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ProveedorLayout>
      <div className="resenas-calificaciones-container">
        <h1>Mis reseñas</h1>

        {/* Estadísticas */}
        {estadisticas && (
          <div className="estadisticas-resenas">
            <div className="stat-card">
              <h3>{estadisticas.promedio.toFixed(1)}</h3>
              <p>Calificación promedio</p>
            </div>
            <div className="stat-card">
              <h3>{estadisticas.total}</h3>
              <p>Total de reseñas</p>
            </div>
            <div className="stat-card">
              <h3>{estadisticas.positivas}</h3>
              <p>Positivas</p>
            </div>
            <div className="stat-card">
              <h3>{estadisticas.neutras}</h3>
              <p>Neutras</p>
            </div>
            <div className="stat-card">
              <h3>{estadisticas.negativas}</h3>
              <p>Negativas</p>
            </div>
          </div>
        )}

        {loading ? (
          <p>Cargando reseñas...</p>
        ) : resenas.length === 0 ? (
          <p>Aún no tienes reseñas.</p>
        ) : (
          <>
            {/* Controles de filtrado — misma estructura que SolicitudesRecibidas */}
            <div className="sr-controles">
              <div className="sr-filtros">
                <FaFilter className="sr-ctrl-icon" />
                <button
                  className={`sr-pill ${filtroSentimiento === "todos" ? "sr-pill-activo" : ""}`}
                  onClick={() => setFiltroSentimiento("todos")}
                >
                  <FaThumbsUp /> Todas ({contarPorSentimiento("todos")})
                </button>
                <button
                  className={`sr-pill ${filtroSentimiento === "positivo" ? "sr-pill-activo" : ""}`}
                  onClick={() => setFiltroSentimiento("positivo")}
                >
                  <FaSmile /> Positivas ({contarPorSentimiento("positivo")})
                </button>
                <button
                  className={`sr-pill ${filtroSentimiento === "neutro" ? "sr-pill-activo" : ""}`}
                  onClick={() => setFiltroSentimiento("neutro")}
                >
                  <FaMeh /> Neutras ({contarPorSentimiento("neutro")})
                </button>
                <button
                  className={`sr-pill ${filtroSentimiento === "negativo" ? "sr-pill-activo" : ""}`}
                  onClick={() => setFiltroSentimiento("negativo")}
                >
                  <FaFrown /> Negativas ({contarPorSentimiento("negativo")})
                </button>
              </div>

              <div className="sr-orden">
                <FaSortAmountDown className="sr-ctrl-icon" />
                <select
                  value={ordenResenas}
                  onChange={(e) => setOrdenResenas(e.target.value)}
                  className="sr-select"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="mejores">Mejor calificadas</option>
                  <option value="peores">Peor calificadas</option>
                </select>
              </div>
            </div>

            {todasFiltradas.length === 0 ? (
              <p>No hay reseñas que coincidan con los filtros seleccionados.</p>
            ) : (
              <>
                {/* Indicador de página */}
                <p className="sr-pag-info">
                  Mostrando <strong>{inicio + 1}–{Math.min(inicio + POR_PAGINA, todasFiltradas.length)}</strong> de{" "}
                  <strong>{todasFiltradas.length}</strong> reseñas
                </p>

                <div className="resenas-list">
                  {resenasPagina.map((resena) => {
                    const badge = getBadge(resena.calificacion);
                    return (
                      <div key={resena.id_resena} className="resena-proveedor-card">
                        <div className="resena-header">
                          <div className="resena-usuario">
                            <div className="avatar-cliente">
                              {resena.cliente_foto ? (
                                <img
                                  src={resena.cliente_foto}
                                  alt={resena.cliente_nombre}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="avatar-inicial"
                                style={{ display: resena.cliente_foto ? "none" : "flex" }}
                              >
                                {(resena.cliente_nombre || "C").charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="resena-info">
                              <h3>{resena.cliente_nombre || "Cliente Anónimo"}</h3>
                              <div className="estrellas">
                                {renderEstrellas(resena.calificacion)}
                              </div>
                              <p className="resena-fecha">
                                {new Date(
                                  resena.fecha_resena || resena.fecha_publicacion
                                ).toLocaleDateString("es-MX", {
                                  year: "numeric", month: "long", day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={`sr-badge ${badge.class}`}>
                            {badge.icono} {badge.text}
                          </span>
                        </div>

                        <p className="resena-comentario">{resena.comentario}</p>

                        <div className="resena-acciones">
                          {resena.reportada ? (
                            <span className="resena-reportada">
                              <FaExclamationTriangle /> Reseña reportada - En revisión
                            </span>
                          ) : (
                            <button
                              className="btn-reportar"
                              onClick={() => handleAbrirModalReportar(resena)}
                              title="Reportar reseña inapropiada"
                            >
                              <FaFlag /> Reportar reseña
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPaginas > 1 && (
                  <nav className="sr-paginacion">
                    <button
                      className="sr-pag-btn sr-pag-nav"
                      onClick={() => irAPagina(paginaActual - 1)}
                      disabled={paginaActual === 1}
                    >
                      <FaChevronLeft />
                    </button>

                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        className={`sr-pag-btn ${paginaActual === n ? "sr-pag-activa" : ""}`}
                        onClick={() => irAPagina(n)}
                      >
                        {n}
                      </button>
                    ))}

                    <button
                      className="sr-pag-btn sr-pag-nav"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                    >
                      <FaChevronRight />
                    </button>
                  </nav>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de reportar reseña */}
      {modalReportarAbierto && resenaSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-reportar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FaFlag /> Reportar Reseña</h2>
              <button className="btn-cerrar-modal" onClick={handleCerrarModal}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="resena-preview">
                <div className="avatar-preview">
                  {resenaSeleccionada.cliente_foto ? (
                    <img src={resenaSeleccionada.cliente_foto} alt="" />
                  ) : (
                    <div className="avatar-inicial-preview">
                      {(resenaSeleccionada.cliente_nombre || "C").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <strong>{resenaSeleccionada.cliente_nombre || "Cliente Anónimo"}</strong>
                  <p className="comentario-preview">{resenaSeleccionada.comentario}</p>
                </div>
              </div>

              <div className="motivos-container">
                <h3>Selecciona el motivo del reporte:</h3>
                {[
                  { value: "lenguaje-ofensivo", icono: <FaExclamationTriangle />, texto: "Lenguaje ofensivo o inapropiado" },
                  { value: "informacion-falsa",  icono: <FaTimes />,              texto: "Información falsa o engañosa" },
                  { value: "spam",               icono: <FaEnvelope />,           texto: "Spam o contenido promocional" },
                  { value: "acoso",              icono: <FaBan />,                texto: "Acoso o amenazas" },
                  { value: "otro",               icono: <FaEdit />,               texto: "Otro motivo" },
                ].map(({ value, icono, texto }) => (
                  <label
                    key={value}
                    className={`motivo-opcion ${motivoReporte === value ? "seleccionado" : ""}`}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={value}
                      checked={motivoReporte === value}
                      onChange={(e) => setMotivoReporte(e.target.value)}
                    />
                    <div className="motivo-contenido">
                      <span className="motivo-icono">{icono}</span>
                      <span className="motivo-texto">{texto}</span>
                    </div>
                  </label>
                ))}

                {motivoReporte === "otro" && (
                  <textarea
                    className="textarea-motivo"
                    placeholder="Describe el motivo del reporte..."
                    value={motivoPersonalizado}
                    onChange={(e) => setMotivoPersonalizado(e.target.value)}
                    rows="4"
                  />
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={handleCerrarModal}
                disabled={enviandoReporte}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-reporte"
                onClick={handleReportarResena}
                disabled={enviandoReporte || !motivoReporte}
              >
                {enviandoReporte ? "Enviando..." : <><FaFlag /> Reportar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProveedorLayout>
  );
}

export default ResenasCalificaciones;