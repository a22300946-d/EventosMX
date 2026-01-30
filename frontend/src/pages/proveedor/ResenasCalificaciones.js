import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { useAuth } from "../../hooks/useAuth";
import api from "../../services/api";
import "./ResenasCalificaciones.css";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

function ResenasCalificaciones() {
  const { user } = useAuth();
  const [resenas, setResenas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para el modal de reportar
  const [modalReportarAbierto, setModalReportarAbierto] = useState(false);
  const [resenaSeleccionada, setResenaSeleccionada] = useState(null);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [enviandoReporte, setEnviandoReporte] = useState(false);

  useEffect(() => {
    if (user && user.id_proveedor) {
      cargarResenas();
    }
  }, [user]);

  const cargarResenas = async () => {
    try {
      setLoading(true);

      if (!user || !user.id_proveedor) {
        console.log("Usuario no cargado aún");
        return;
      }

      // Cargar reseñas del proveedor autenticado
      const response = await api.get(`/resenas/proveedor/${user.id_proveedor}`);
      const resenasData = response.data.data || [];

      // Ordenar reseñas: primero las más recientes
      const resenasOrdenadas = resenasData.sort((a, b) => {
        return (
          new Date(b.fecha_resena || b.fecha_publicacion) -
          new Date(a.fecha_resena || a.fecha_publicacion)
        );
      });

      setResenas(resenasOrdenadas);

      // Calcular estadísticas
      if (resenasOrdenadas.length > 0) {
        const total = resenasOrdenadas.length;

        // Calcular promedio de calificación (0 a 1)
        const sumaCalificaciones = resenasOrdenadas.reduce((sum, r) => {
          return sum + parseFloat(r.calificacion || 0);
        }, 0);
        const promedio = sumaCalificaciones / total;

        // Contar por sentimiento según el análisis de Google
        const positivas = resenasOrdenadas.filter((r) => {
          const cal = parseFloat(r.calificacion || 0);
          return cal >= 0.625;
        }).length;

        const negativas = resenasOrdenadas.filter((r) => {
          const cal = parseFloat(r.calificacion || 0);
          return cal <= 0.375;
        }).length;

        const neutras = total - positivas - negativas;

        setEstadisticas({
          total,
          promedio: promedio * 5,
          positivas,
          neutras,
          negativas,
        });
      } else {
        setEstadisticas({
          total: 0,
          promedio: 0,
          positivas: 0,
          neutras: 0,
          negativas: 0,
        });
      }
    } catch (error) {
      console.error("Error al cargar reseñas:", error);
      setResenas([]);
      setEstadisticas({
        total: 0,
        promedio: 0,
        positivas: 0,
        neutras: 0,
        negativas: 0,
      });
    } finally {
      setLoading(false);
    }
  };

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

  const getBadge = (calificacion) => {
    const cal = parseFloat(calificacion || 0);

    if (cal >= 0.625) {
      return { class: "badge-positivo", text: "Reseña positiva" };
    } else if (cal <= 0.375) {
      return { class: "badge-negativo", text: "Reseña negativa" };
    }
    return { class: "badge-neutro", text: "Reseña neutra" };
  };

  // Función para abrir el modal de reportar
  const handleAbrirModalReportar = (resena) => {
    setResenaSeleccionada(resena);
    setModalReportarAbierto(true);
    setMotivoReporte("");
    setMotivoPersonalizado("");
  };

  // Función para cerrar el modal
  const handleCerrarModal = () => {
    setModalReportarAbierto(false);
    setResenaSeleccionada(null);
    setMotivoReporte("");
    setMotivoPersonalizado("");
  };

  // Función para reportar una reseña
  const handleReportarResena = async () => {
    const motivoFinal =
      motivoReporte === "otro" ? motivoPersonalizado : motivoReporte;

    if (!motivoFinal || motivoFinal.trim() === "") {
      alert("Por favor, selecciona o escribe un motivo para el reporte.");
      return;
    }

    try {
      setEnviandoReporte(true);

      await api.put(`/resenas/${resenaSeleccionada.id_resena}/reportar`, {
        motivo: motivoFinal.trim(),
      });

      alert(
        "✅ Reseña reportada exitosamente. Nuestro equipo la revisará pronto.",
      );

      // Cerrar modal y recargar reseñas
      handleCerrarModal();
      cargarResenas();
    } catch (error) {
      console.error("Error al reportar reseña:", error);
      alert("❌ Error al reportar la reseña. Por favor, intenta nuevamente.");
    } finally {
      setEnviandoReporte(false);
    }
  };

  return (
    <ProveedorLayout>
      <div className="resenas-calificaciones-container">
        <h1>Mis reseñas</h1>

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
          <div className="resenas-list">
            {resenas.map((resena) => {
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
                          style={{
                            display: resena.cliente_foto ? "none" : "flex",
                          }}
                        >
                          {(resena.cliente_nombre || "C")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      </div>
                      <div className="resena-info">
                        <h3>{resena.cliente_nombre || "Cliente Anónimo"}</h3>
                        <div className="estrellas">
                          {renderEstrellas(resena.calificacion)}
                        </div>
                        <p className="resena-fecha">
                          {new Date(
                            resena.fecha_resena || resena.fecha_publicacion,
                          ).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </div>

                  <p className="resena-comentario">{resena.comentario}</p>

                  {/* Botón de reportar */}
                  <div className="resena-acciones">
                    {resena.reportada ? (
                      <span className="resena-reportada">
                        ⚠️ Reseña reportada - En revisión
                      </span>
                    ) : (
                      <button
                        className="btn-reportar"
                        onClick={() => handleAbrirModalReportar(resena)}
                        title="Reportar reseña inapropiada"
                      >
                        🚩 Reportar reseña
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de reportar reseña */}
      {modalReportarAbierto && resenaSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarModal}>
          <div className="modal-reportar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚩 Reportar Reseña</h2>
              <button className="btn-cerrar-modal" onClick={handleCerrarModal}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="resena-preview">
                <div className="avatar-preview">
                  {resenaSeleccionada.cliente_foto ? (
                    <img src={resenaSeleccionada.cliente_foto} alt="" />
                  ) : (
                    <div className="avatar-inicial-preview">
                      {(resenaSeleccionada.cliente_nombre || "C")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <strong>
                    {resenaSeleccionada.cliente_nombre || "Cliente Anónimo"}
                  </strong>
                  <p className="comentario-preview">
                    {resenaSeleccionada.comentario}
                  </p>
                </div>
              </div>

              <div className="motivos-container">
                <h3>Selecciona el motivo del reporte:</h3>

                <label
                  className={`motivo-opcion ${motivoReporte === "lenguaje-ofensivo" ? "seleccionado" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="lenguaje-ofensivo"
                    checked={motivoReporte === "lenguaje-ofensivo"}
                    onChange={(e) => setMotivoReporte(e.target.value)}
                  />
                  <div className="motivo-contenido">
                    <span className="motivo-icono">😠</span>
                    <span className="motivo-texto">
                      Lenguaje ofensivo o inapropiado
                    </span>
                  </div>
                </label>

                <label
                  className={`motivo-opcion ${motivoReporte === "informacion-falsa" ? "seleccionado" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="informacion-falsa"
                    checked={motivoReporte === "informacion-falsa"}
                    onChange={(e) => setMotivoReporte(e.target.value)}
                  />
                  <div className="motivo-contenido">
                    <span className="motivo-icono">❌</span>
                    <span className="motivo-texto">
                      Información falsa o engañosa
                    </span>
                  </div>
                </label>

                <label
                  className={`motivo-opcion ${motivoReporte === "spam" ? "seleccionado" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="spam"
                    checked={motivoReporte === "spam"}
                    onChange={(e) => setMotivoReporte(e.target.value)}
                  />
                  <div className="motivo-contenido">
                    <span className="motivo-icono">📧</span>
                    <span className="motivo-texto">
                      Spam o contenido promocional
                    </span>
                  </div>
                </label>

                <label
                  className={`motivo-opcion ${motivoReporte === "acoso" ? "seleccionado" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="acoso"
                    checked={motivoReporte === "acoso"}
                    onChange={(e) => setMotivoReporte(e.target.value)}
                  />
                  <div className="motivo-contenido">
                    <span className="motivo-icono">🚫</span>
                    <span className="motivo-texto">Acoso o amenazas</span>
                  </div>
                </label>

                <label
                  className={`motivo-opcion ${motivoReporte === "otro" ? "seleccionado" : ""}`}
                >
                  <input
                    type="radio"
                    name="motivo"
                    value="otro"
                    checked={motivoReporte === "otro"}
                    onChange={(e) => setMotivoReporte(e.target.value)}
                  />
                  <div className="motivo-contenido">
                    <span className="motivo-icono">✏️</span>
                    <span className="motivo-texto">Otro motivo</span>
                  </div>
                </label>

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
                {enviandoReporte ? "Enviando..." : "🚩 Reportar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProveedorLayout>
  );
}

export default ResenasCalificaciones;
