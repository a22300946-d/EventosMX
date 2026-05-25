import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClipboardList, FaCalendarAlt, FaUsers, FaMoneyBillWave,
  FaTag, FaInbox, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaSpinner, FaRedo,
  FaFilter, FaSortAmountDown, FaEye, FaCheckCircle,
  FaHourglassHalf, FaTimesCircle, FaCommentDots,
  FaChartBar, FaMapMarkerAlt, FaStar,
  FaEnvelopeOpenText, FaBan, FaUserTie, FaInfoCircle,
} from "react-icons/fa";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./HistorialSolicitudes.css";

const POR_PAGINA = 10;

const ESTADOS = [
  { key: "todos",      label: "Todas",         icono: <FaClipboardList /> },
  { key: "Pendiente",  label: "Pendientes",     icono: <FaHourglassHalf /> },
  { key: "Respondida", label: "Con respuesta",  icono: <FaEnvelopeOpenText /> },
  { key: "Aceptada",   label: "Aceptadas",      icono: <FaCheckCircle /> },
  { key: "Rechazada",  label: "Rechazadas",     icono: <FaBan /> },
];

function HistorialSolicitudes() {
  const [solicitudes, setSolicitudes]           = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState(null);
  const [filtroEstado, setFiltroEstado]         = useState("todos");
  const [orden, setOrden]                       = useState("recientes");
  const [paginaActual, setPaginaActual]         = useState(1);
  const [expandidas, setExpandidas]             = useState({});

  const navigate = useNavigate();

  useEffect(() => { cargarSolicitudes(); }, []);
  useEffect(() => { setPaginaActual(1); }, [filtroEstado, orden]);

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

  const toggleExpandida = (id) =>
    setExpandidas((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Filtrado y orden ───────────────────────────────────────────

  const contarPorEstado = (estado) =>
    estado === "todos"
      ? solicitudes.length
      : solicitudes.filter((s) => s.estado === estado).length;

  const getSolicitudesFiltradas = () => {
    let lista = [...solicitudes];
    if (filtroEstado !== "todos")
      lista = lista.filter((s) => s.estado === filtroEstado);

    if (orden === "recientes")
      lista.sort((a, b) => new Date(b.fecha_envio) - new Date(a.fecha_envio));
    else if (orden === "antiguos")
      lista.sort((a, b) => new Date(a.fecha_envio) - new Date(b.fecha_envio));
    else if (orden === "evento")
      lista.sort((a, b) => new Date(a.fecha_evento) - new Date(b.fecha_evento));

    return lista;
  };

  const todasFiltradas = getSolicitudesFiltradas();
  const totalPaginas   = Math.max(1, Math.ceil(todasFiltradas.length / POR_PAGINA));
  const inicio         = (paginaActual - 1) * POR_PAGINA;
  const paginadas      = todasFiltradas.slice(inicio, inicio + POR_PAGINA);

  const irAPagina = (n) => {
    if (n < 1 || n > totalPaginas) return;
    setPaginaActual(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  // ── Helpers ────────────────────────────────────────────────────

  const getEstadoInfo = (estado) => {
    switch (estado) {
      case "Aceptada":   return { clase: "sr-badge-aceptada",   texto: "Aceptada",      icono: <FaCheckCircle /> };
      case "Pendiente":  return { clase: "sr-badge-pendiente",  texto: "Pendiente",     icono: <FaHourglassHalf /> };
      case "Respondida": return { clase: "sr-badge-respondida", texto: "Con respuesta", icono: <FaEnvelopeOpenText /> };
      case "Rechazada":  return { clase: "sr-badge-rechazada",  texto: "Rechazada",     icono: <FaBan /> };
      case "Cancelada":  return { clase: "sr-badge-cancelada",  texto: "Cancelada",     icono: <FaTimesCircle /> };
      default:           return { clase: "sr-badge-default",    texto: estado,          icono: <FaClipboardList /> };
    }
  };

  const fmt = (fecha) =>
    fecha
      ? new Date(fecha).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })
      : "—";

  const fmtCorta = (fecha) =>
    fecha
      ? new Date(fecha).toLocaleDateString("es-MX", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : "—";

  const fmtMXN = (valor) =>
    valor
      ? parseFloat(valor).toLocaleString("es-MX", {
          style: "currency", currency: "MXN", maximumFractionDigits: 0,
        })
      : null;

  // ── Renders condicionales ──────────────────────────────────────

  if (loading) {
    return (
      <ClienteLayout>
        <div className="sr-loading">
          <FaSpinner className="sr-spinner" />
          <p>Cargando tu historial de solicitudes...</p>
        </div>
      </ClienteLayout>
    );
  }

  if (error) {
    return (
      <ClienteLayout>
        <div className="sr-error">
          <FaExclamationTriangle />
          <h3>{error}</h3>
          <button onClick={cargarSolicitudes} className="sr-btn-retry">
            <FaRedo /> Reintentar
          </button>
        </div>
      </ClienteLayout>
    );
  }

  // ── Render principal ───────────────────────────────────────────

  return (
    <ClienteLayout>
      <div className="sr-root">

        {/* Encabezado */}
        <header className="sr-header">
          <div className="sr-header-left">
            <FaClipboardList className="sr-header-icon" />
            <div>
              <h1>Historial de Solicitudes</h1>
              <p>Consulta y gestiona todas las solicitudes que has enviado a proveedores</p>
            </div>
          </div>
          <div className="sr-header-stat">
            <span className="sr-total-num">{solicitudes.length}</span>
            <span className="sr-total-lbl">solicitudes</span>
          </div>
        </header>

        {solicitudes.length === 0 ? (
          <div className="sr-empty">
            <FaInbox className="sr-empty-icon" />
            <h3>Sin solicitudes aún</h3>
            <p>Las solicitudes que envíes a proveedores aparecerán aquí</p>
          </div>
        ) : (
          <>
            {/* Tarjetas resumen por estado */}
            <div className="sr-resumen">
              {ESTADOS.filter((e) => e.key !== "todos").map(({ key, label, icono }) => (
                <button
                  key={key}
                  className={`sr-resumen-card sr-estado-${key.toLowerCase()} ${
                    filtroEstado === key ? "sr-resumen-activo" : ""
                  }`}
                  onClick={() => setFiltroEstado(filtroEstado === key ? "todos" : key)}
                >
                  <span className="sr-resumen-ico">{icono}</span>
                  <span className="sr-resumen-num">{contarPorEstado(key)}</span>
                  <span className="sr-resumen-lbl">{label}</span>
                </button>
              ))}
            </div>

            {/* Controles filtro/orden */}
            <div className="sr-controles">
              <div className="sr-filtros">
                <FaFilter className="sr-ctrl-icon" />
                {ESTADOS.map(({ key, label, icono }) => (
                  <button
                    key={key}
                    className={`sr-pill ${filtroEstado === key ? "sr-pill-activo" : ""}`}
                    onClick={() => setFiltroEstado(key)}
                  >
                    {icono} {label} ({contarPorEstado(key)})
                  </button>
                ))}
              </div>

              <div className="sr-orden">
                <FaSortAmountDown className="sr-ctrl-icon" />
                <select
                  value={orden}
                  onChange={(e) => setOrden(e.target.value)}
                  className="sr-select"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="antiguos">Más antiguos</option>
                  <option value="evento">Fecha del evento</option>
                </select>
              </div>
            </div>

            {/* Lista o vacío filtrado */}
            {todasFiltradas.length === 0 ? (
              <div className="sr-empty">
                <FaClipboardList className="sr-empty-icon" />
                <h3>Sin resultados</h3>
                <p>No hay solicitudes que coincidan con el filtro seleccionado</p>
              </div>
            ) : (
              <>
                <p className="sr-pag-info">
                  Mostrando{" "}
                  <strong>{inicio + 1}–{Math.min(inicio + POR_PAGINA, todasFiltradas.length)}</strong>
                  {" "}de <strong>{todasFiltradas.length}</strong> solicitudes
                </p>

                <div className="sr-lista">
                  {paginadas.map((sol) => {
                    const est     = getEstadoInfo(sol.estado);
                    const abierta = expandidas[sol.id_solicitud];

                    return (
                      <article
                        key={sol.id_solicitud}
                        className={`sr-card sr-card-${sol.estado?.toLowerCase()}`}
                      >
                        {/* Header de la card */}
                        <div className="sr-card-top">
                          <div className="sr-cliente-info">
                            {sol.logo ? (
                              <img
                                src={sol.logo}
                                alt={sol.nombre_negocio}
                                className="sr-avatar"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              <FaUserTie className="sr-avatar-placeholder" />
                            )}
                            <div>
                              <button
                                className="sr-proveedor-nombre"
                                onClick={() => navigate(`/perfil-proveedor/${sol.id_proveedor}`)}
                              >
                                <FaUserTie className="sr-np-ico" />
                                {sol.nombre_negocio}
                              </button>
                              {sol.proveedor_ciudad && (
                                <span className="sr-ciudad">
                                  <FaMapMarkerAlt /> {sol.proveedor_ciudad}
                                </span>
                              )}
                              {sol.calificacion_promedio > 0 && (
                                <span className="sr-rating">
                                  <FaStar />
                                  {(parseFloat(sol.calificacion_promedio) * 5).toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className={`sr-badge ${est.clase}`}>
                            {est.icono} {est.texto}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="sr-card-tags">
                          {sol.tipo_servicio && (
                            <span className="sr-tag">
                              <FaTag /> {sol.tipo_servicio}
                            </span>
                          )}
                          {sol.tipo_evento && (
                            <span className="sr-tag sr-tag-evento">
                              <FaChartBar /> {sol.tipo_evento}
                            </span>
                          )}
                        </div>

                        {/* Detalles principales */}
                        <div className="sr-detalles-grid">
                          <div className="sr-detalle">
                            <FaCalendarAlt className="sr-d-ico" />
                            <div>
                              <span className="sr-d-lbl">Fecha del evento</span>
                              <span className="sr-d-val">{fmt(sol.fecha_evento)}</span>
                            </div>
                          </div>

                          {sol.numero_invitados && (
                            <div className="sr-detalle">
                              <FaUsers className="sr-d-ico" />
                              <div>
                                <span className="sr-d-lbl">Invitados</span>
                                <span className="sr-d-val">{sol.numero_invitados} personas</span>
                              </div>
                            </div>
                          )}

                          {sol.presupuesto_estimado && (
                            <div className="sr-detalle">
                              <FaMoneyBillWave className="sr-d-ico" />
                              <div>
                                <span className="sr-d-lbl">Presupuesto estimado</span>
                                <span className="sr-d-val sr-precio">{fmtMXN(sol.presupuesto_estimado)}</span>
                              </div>
                            </div>
                          )}

                          {sol.lugar_evento && (
                            <div className="sr-detalle">
                              <FaMapMarkerAlt className="sr-d-ico" />
                              <div>
                                <span className="sr-d-lbl">Lugar</span>
                                <span className="sr-d-val">{sol.lugar_evento}</span>
                              </div>
                            </div>
                          )}

                          <div className="sr-detalle">
                            <FaClipboardList className="sr-d-ico" />
                            <div>
                              <span className="sr-d-lbl">Enviada el</span>
                              <span className="sr-d-val">{fmtCorta(sol.fecha_envio)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Detalle expandible */}
                        {abierta && (
                          <div className="sr-extra">
                            <div className="sr-extra-grid">
                              {sol.descripcion_solicitud && (
                                <div className="sr-extra-item" style={{ gridColumn: "1 / -1" }}>
                                  <span className="sr-extra-item-lbl">Descripción de la solicitud</span>
                                  <span className="sr-extra-item-val">{sol.descripcion_solicitud}</span>
                                </div>
                              )}
                              {sol.descripcion_evento && (
                                <div className="sr-extra-item" style={{ gridColumn: "1 / -1" }}>
                                  <span className="sr-extra-item-lbl">Descripción del evento</span>
                                  <span className="sr-extra-item-val">{sol.descripcion_evento}</span>
                                </div>
                              )}
                              {sol.mensaje_cliente && (
                                <div className="sr-extra-item" style={{ gridColumn: "1 / -1" }}>
                                  <span className="sr-extra-item-lbl">Tu mensaje al proveedor</span>
                                  <span className="sr-extra-item-val">{sol.mensaje_cliente}</span>
                                </div>
                              )}
                              {sol.detalles_servicio && (
                                <div className="sr-extra-item" style={{ gridColumn: "1 / -1" }}>
                                  <span className="sr-extra-item-lbl">Detalles del servicio</span>
                                  <span className="sr-extra-item-val">{sol.detalles_servicio}</span>
                                </div>
                              )}
                              {sol.fecha_respuesta && (
                                <div className="sr-extra-item">
                                  <span className="sr-extra-item-lbl">Fecha de respuesta</span>
                                  <span className="sr-extra-item-val">{fmtCorta(sol.fecha_respuesta)}</span>
                                </div>
                              )}
                              {sol.fecha_aceptacion && (
                                <div className="sr-extra-item">
                                  <span className="sr-extra-item-lbl">Fecha de aceptación</span>
                                  <span className="sr-extra-item-val">{fmtCorta(sol.fecha_aceptacion)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Propuesta del proveedor */}
                        {sol.precio_propuesto && (
                          <div className="sr-propuesta">
                            <div className="sr-propuesta-header">
                              <FaEnvelopeOpenText />
                              <span>Propuesta del proveedor</span>
                            </div>
                            <div className="sr-propuesta-precio">
                              <FaMoneyBillWave />
                              <strong>{fmtMXN(sol.precio_propuesto)}</strong>
                            </div>
                            {sol.mensaje_respuesta && (
                              <p className="sr-propuesta-msg">{sol.mensaje_respuesta}</p>
                            )}
                            {sol.fecha_disponible && (
                              <p className="sr-propuesta-fecha">
                                <FaCalendarAlt /> Fecha propuesta: {fmt(sol.fecha_disponible)}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Footer de acciones */}
                        <div className="sr-card-footer">
                          <button
                            className="sr-btn-expandir"
                            onClick={() => toggleExpandida(sol.id_solicitud)}
                          >
                            <FaInfoCircle />
                            {abierta ? "Ocultar detalles" : "Ver todos los detalles"}
                          </button>

                          <div className="sr-acciones">
                            <button
                              className="sr-btn-perfil"
                              onClick={() => navigate(`/perfil-proveedor/${sol.id_proveedor}`)}
                            >
                              <FaEye /> Ver perfil
                            </button>
                            <button
                              className="sr-btn-chat"
                              onClick={() => navigate(`/chat/${sol.id_solicitud}`)}
                            >
                              <FaCommentDots /> Abrir chat
                            </button>
                          </div>
                        </div>
                      </article>
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
                      aria-label="Página anterior"
                    >
                      <FaChevronLeft />
                    </button>

                    {getPaginas().map((n, i) =>
                      n === "..." ? (
                        <span key={`ellipsis-${i}`} className="sr-pag-ellipsis">…</span>
                      ) : (
                        <button
                          key={n}
                          className={`sr-pag-btn ${paginaActual === n ? "sr-pag-activa" : ""}`}
                          onClick={() => irAPagina(n)}
                        >
                          {n}
                        </button>
                      )
                    )}

                    <button
                      className="sr-pag-btn sr-pag-nav"
                      onClick={() => irAPagina(paginaActual + 1)}
                      disabled={paginaActual === totalPaginas}
                      aria-label="Página siguiente"
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
    </ClienteLayout>
  );
}

export default HistorialSolicitudes;