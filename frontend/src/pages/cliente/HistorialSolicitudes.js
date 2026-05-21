import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaBuilding, FaTag, FaInbox, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaSpinner, FaRedo,
  FaFilter, FaSortAmountDown, FaEye, FaCheckCircle,
  FaHourglassHalf, FaTimesCircle, FaCommentDots, FaSearch,
  FaChartBar, FaMapMarkerAlt, FaStar,
} from "react-icons/fa";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./HistorialSolicitudes.css";

const POR_PAGINA = 10;

function HistorialSolicitudes() {
  const [solicitudes, setSolicitudes]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [filtroEstado, setFiltroEstado]         = useState("todos");
  const [ordenSolicitudes, setOrdenSolicitudes] = useState("recientes");
  const [paginaActual, setPaginaActual]         = useState(1);

  const navigate = useNavigate();

  useEffect(() => { cargarSolicitudes(); }, []);
  useEffect(() => { setPaginaActual(1); }, [filtroEstado, ordenSolicitudes]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clienteService.obtenerMisSolicitudes();
      setSolicitudes(response.data.data || []);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
      setError("Error al cargar tu historial de solicitudes");
    } finally {
      setLoading(false);
    }
  };

  // ── Filtrado y orden ──────────────────────────────────────────────────────

  const contarPorEstado = (estado) => {
    if (estado === "todos") return solicitudes.length;
    return solicitudes.filter((s) => s.estado === estado).length;
  };

  const obtenerSolicitudesFiltradas = () => {
    let filtradas = [...solicitudes];

    if (filtroEstado !== "todos") {
      filtradas = filtradas.filter((s) => s.estado === filtroEstado);
    }

    if (ordenSolicitudes === "recientes") {
      filtradas.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
    } else if (ordenSolicitudes === "antiguos") {
      filtradas.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
    } else if (ordenSolicitudes === "evento") {
      filtradas.sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));
    }

    return filtradas;
  };

  const todasFiltradas  = obtenerSolicitudesFiltradas();
  const totalPaginas    = Math.ceil(todasFiltradas.length / POR_PAGINA);
  const inicio          = (paginaActual - 1) * POR_PAGINA;
  const solicitudesPag  = todasFiltradas.slice(inicio, inicio + POR_PAGINA);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Helpers UI ────────────────────────────────────────────────────────────

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case "Aceptada":
        return { clase: "badge-aceptada", texto: "Cotización aceptada",    icono: <FaCheckCircle /> };
      case "Pendiente":
        return { clase: "badge-pendiente", texto: "En espera de respuesta", icono: <FaHourglassHalf /> };
      case "Respondida":
        return { clase: "badge-respondida", texto: "Propuesta recibida",    icono: <FaCommentDots /> };
      case "Rechazada":
        return { clase: "badge-rechazada", texto: "Solicitud rechazada",    icono: <FaTimesCircle /> };
      case "Cancelada":
        return { clase: "badge-cancelada", texto: "Solicitud cancelada",    icono: <FaTimesCircle /> };
      default:
        return { clase: "badge-default", texto: estado,                     icono: <FaClipboardList /> };
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return "—";
    return new Date(fecha).toLocaleDateString("es-MX", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatearPresupuesto = (valor) => {
    if (!valor) return null;
    return parseFloat(valor).toLocaleString("es-MX", {
      style: "currency", currency: "MXN", maximumFractionDigits: 0,
    });
  };

  // ── Renderizado condicional ───────────────────────────────────────────────

  if (loading) {
    return (
      <ClienteLayout>
        <div className="historial-container">
          <div className="loading-container">
            <FaSpinner className="spinner-icon spin" />
            <p>Cargando tu historial de solicitudes...</p>
          </div>
        </div>
      </ClienteLayout>
    );
  }

  if (error) {
    return (
      <ClienteLayout>
        <div className="historial-container">
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <h3>{error}</h3>
            <button onClick={cargarSolicitudes} className="btn-reintentar">
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
      <div className="historial-container">

        {/* Header */}
        <div className="historial-header">
          <div className="historial-header-titulo">
            <FaClipboardList className="header-icon" />
            <div>
              <h1>Historial de Solicitudes</h1>
              <p className="historial-subtitle">
                Consulta y gestiona todas las solicitudes que has enviado a proveedores
              </p>
            </div>
          </div>
        </div>

        {solicitudes.length === 0 ? (
          <div className="empty-state">
            <FaInbox className="empty-icon" />
            <h3>No tienes solicitudes aún</h3>
            <p>Las solicitudes que envíes a proveedores aparecerán aquí</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="historial-info">
              <FaChartBar className="info-icon" />
              <p>
                Tienes <strong>{solicitudes.length}</strong>{" "}
                {solicitudes.length === 1 ? "solicitud registrada" : "solicitudes registradas"}
              </p>
            </div>

            {/* Tarjetas de resumen por estado */}
            <div className="resumen-estados">
              {[
                { estado: "Pendiente",  label: "Pendientes",  icono: <FaHourglassHalf /> },
                { estado: "Respondida", label: "Con propuesta", icono: <FaCommentDots /> },
                { estado: "Aceptada",   label: "Aceptadas",   icono: <FaCheckCircle /> },
                { estado: "Rechazada",  label: "Rechazadas",  icono: <FaTimesCircle /> },
              ].map(({ estado, label, icono }) => (
                <div
                  key={estado}
                  className={`resumen-card resumen-${estado.toLowerCase()} ${filtroEstado === estado ? "resumen-activo" : ""}`}
                  onClick={() => setFiltroEstado(filtroEstado === estado ? "todos" : estado)}
                >
                  <span className="resumen-icono">{icono}</span>
                  <span className="resumen-numero">{contarPorEstado(estado)}</span>
                  <span className="resumen-label">{label}</span>
                </div>
              ))}
            </div>

            {/* Controles */}
            <div className="historial-controles">
              <div className="filtro-estado">
                <FaFilter className="filtro-icon" />
                <button
                  className={`btn-filtro ${filtroEstado === "todos" ? "activo" : ""}`}
                  onClick={() => setFiltroEstado("todos")}
                >
                  Todas ({contarPorEstado("todos")})
                </button>
                {["Pendiente", "Respondida", "Aceptada", "Rechazada"].map((estado) => {
                  const info = getEstadoInfo(estado);
                  return (
                    <button
                      key={estado}
                      className={`btn-filtro btn-filtro-${estado.toLowerCase()} ${filtroEstado === estado ? "activo" : ""}`}
                      onClick={() => setFiltroEstado(estado)}
                    >
                      {info.icono} {info.texto.split(" ")[0]} ({contarPorEstado(estado)})
                    </button>
                  );
                })}
              </div>

              <div className="filtro-ordenamiento">
                <FaSortAmountDown className="filtro-icon" />
                <label>Ordenar por:</label>
                <select
                  value={ordenSolicitudes}
                  onChange={(e) => setOrdenSolicitudes(e.target.value)}
                  className="select-ordenamiento"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Más antiguos</option>
                  <option value="evento">Fecha del evento</option>
                </select>
              </div>
            </div>

            {/* Lista o vacío filtrado */}
            {todasFiltradas.length === 0 ? (
              <div className="empty-state">
                <FaSearch className="empty-icon" />
                <h3>Sin resultados</h3>
                <p>No hay solicitudes que coincidan con los filtros seleccionados</p>
              </div>
            ) : (
              <>
                <div className="paginacion-info">
                  <p>
                    Mostrando <strong>{inicio + 1}–{Math.min(inicio + POR_PAGINA, todasFiltradas.length)}</strong> de{" "}
                    <strong>{todasFiltradas.length}</strong> solicitudes
                  </p>
                </div>

                <div className="solicitudes-list">
                  {solicitudesPag.map((solicitud) => {
                    const estadoInfo = getEstadoInfo(solicitud.estado);

                    return (
                      <div key={solicitud.id_solicitud} className={`solicitud-card estado-${solicitud.estado?.toLowerCase()}`}>

                        {/* Header de la card */}
                        <div className="solicitud-card-header">
                          <div className="solicitud-proveedor-info">
                            {solicitud.logo && (
                              <img
                                src={solicitud.logo}
                                alt={solicitud.nombre_negocio}
                                className="proveedor-logo"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            )}
                            <div>
                              <h3
                                className="proveedor-nombre-link"
                                onClick={() => navigate(`/perfil-proveedor/${solicitud.id_proveedor}`)}
                              >
                                {solicitud.nombre_negocio}
                              </h3>
                              {solicitud.proveedor_ciudad && (
                                <p className="proveedor-ciudad">
                                  <FaMapMarkerAlt /> {solicitud.proveedor_ciudad}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`badge ${estadoInfo.clase}`}>
                            {estadoInfo.icono} {estadoInfo.texto}
                          </span>
                        </div>

                        {/* Categoría / tipo de servicio */}
                        <div className="solicitud-categoria-row">
                          <span className="categoria-badge">
                            <FaTag /> {solicitud.tipo_servicio || "Servicio de eventos"}
                          </span>
                          {solicitud.calificacion_promedio > 0 && (
                            <span className="proveedor-rating">
                              <FaStar className="star-icon" />
                              {parseFloat(solicitud.calificacion_promedio * 5).toFixed(1)}
                            </span>
                          )}
                        </div>

                        {/* Detalles del evento */}
                        <div className="solicitud-detalles">
                          <div className="detalle-item">
                            <FaTag className="detalle-icon" />
                            <div>
                              <span className="detalle-label">Tipo de evento</span>
                              <span className="detalle-valor">{solicitud.tipo_evento || "—"}</span>
                            </div>
                          </div>

                          <div className="detalle-item">
                            <FaCalendarAlt className="detalle-icon" />
                            <div>
                              <span className="detalle-label">Fecha del evento</span>
                              <span className="detalle-valor">{formatearFecha(solicitud.fecha_evento)}</span>
                            </div>
                          </div>

                          {solicitud.numero_invitados && (
                            <div className="detalle-item">
                              <FaUsers className="detalle-icon" />
                              <div>
                                <span className="detalle-label">Invitados</span>
                                <span className="detalle-valor">{solicitud.numero_invitados} personas</span>
                              </div>
                            </div>
                          )}

                          {solicitud.presupuesto_estimado && (
                            <div className="detalle-item">
                              <FaMoneyBillWave className="detalle-icon" />
                              <div>
                                <span className="detalle-label">Presupuesto estimado</span>
                                <span className="detalle-valor presupuesto">
                                  {formatearPresupuesto(solicitud.presupuesto_estimado)}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="detalle-item">
                            <FaClipboardList className="detalle-icon" />
                            <div>
                              <span className="detalle-label">Solicitud enviada</span>
                              <span className="detalle-valor">{formatearFechaHora(solicitud.fecha_envio)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Propuesta del proveedor (si fue respondida) */}
                        {solicitud.precio_propuesto && (
                          <div className="propuesta-proveedor">
                            <div className="propuesta-header">
                              <FaCommentDots className="propuesta-icon" />
                              <span>Propuesta del proveedor</span>
                            </div>
                            <div className="propuesta-precio">
                              <FaMoneyBillWave />
                              <strong>{formatearPresupuesto(solicitud.precio_propuesto)}</strong>
                            </div>
                            {solicitud.mensaje_respuesta && (
                              <p className="propuesta-mensaje">"{solicitud.mensaje_respuesta}"</p>
                            )}
                            {solicitud.fecha_disponible && (
                              <p className="propuesta-fecha">
                                <FaCalendarAlt /> Fecha propuesta: {formatearFecha(solicitud.fecha_disponible)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="solicitud-footer">
                          <button
                            className="btn-ver-proveedor"
                            onClick={() => navigate(`/perfil-proveedor/${solicitud.id_proveedor}`)}
                          >
                            <FaEye /> Ver perfil del proveedor
                          </button>
                          {solicitud.id_solicitud && (
                            <button
                              className="btn-abrir-chat"
                              onClick={() => navigate(`/chat/${solicitud.id_solicitud}`)}
                            >
                              <FaCommentDots /> Abrir chat
                            </button>
                          )}
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

export default HistorialSolicitudes;