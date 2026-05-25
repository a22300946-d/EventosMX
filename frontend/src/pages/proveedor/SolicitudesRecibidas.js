import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { useNavigate } from "react-router-dom";
import "./SolicitudesRecibidas.css";

const ITEMS_POR_PAGINA = 3;

function SolicitudesRecibidas() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await proveedorService.obtenerSolicitudesRecibidas();
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirChat = (idSolicitud) => {
    navigate(`/chat/${idSolicitud}`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "—";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getEstadoBadge = (estado) => {
    const mapa = {
      Pendiente: "badge-pendiente",
      Respondida: "badge-respondida",
      Aceptada: "badge-aceptada",
      Rechazada: "badge-rechazada",
    };
    return mapa[estado] || "badge-pendiente";
  };

  const totalPaginas = Math.ceil(solicitudes.length / ITEMS_POR_PAGINA);
  const solicitudesPaginadas = solicitudes.slice(
    paginaActual * ITEMS_POR_PAGINA,
    (paginaActual + 1) * ITEMS_POR_PAGINA
  );

  return (
    <ProveedorLayout>
      <div className="sr-container">
        <h1 className="sr-titulo">Mis Solicitudes</h1>

        {loading ? (
          <p className="sr-cargando">Cargando solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <div className="sr-vacio">
            <div className="sr-vacio-icono">📋</div>
            <p>Aún no has recibido solicitudes.</p>
            <span>Cuando un cliente te contacte, aparecerá aquí.</span>
          </div>
        ) : (
          <>
            <p className="sr-total">{solicitudes.length} solicitud{solicitudes.length !== 1 ? "es" : ""} recibida{solicitudes.length !== 1 ? "s" : ""}</p>

            <div className="sr-lista">
              {solicitudesPaginadas.map((solicitud) => (
                <div key={solicitud.id_solicitud} className="sr-card">
                  {/* Header de la card */}
                  <div className="sr-card-header">
                    <div className="sr-header-izq">
                      <h3 className="sr-tipo-evento">
                        {solicitud.tipo_evento || "Evento"}
                      </h3>
                      <span className={`sr-badge ${getEstadoBadge(solicitud.estado)}`}>
                        {solicitud.estado || "Pendiente"}
                      </span>
                    </div>
                    <div className="sr-header-der">
                      <span className="sr-fecha-envio">
                        Recibida: {formatearFecha(solicitud.fecha_envio)}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo de la card con info completa */}
                  <div className="sr-card-body">
                    <div className="sr-info-grid">
                      <div className="sr-info-item">
                        <span className="sr-info-label">📅 Fecha del evento</span>
                        <span className="sr-info-valor">{formatearFecha(solicitud.fecha_evento)}</span>
                      </div>
                      <div className="sr-info-item">
                        <span className="sr-info-label">👤 Cliente</span>
                        <span className="sr-info-valor">{solicitud.cliente_nombre || "—"}</span>
                      </div>
                      {solicitud.numero_invitados && (
                        <div className="sr-info-item">
                          <span className="sr-info-label">👥 Invitados</span>
                          <span className="sr-info-valor">{solicitud.numero_invitados}</span>
                        </div>
                      )}
                      {solicitud.presupuesto_estimado && (
                        <div className="sr-info-item">
                          <span className="sr-info-label">💰 Presupuesto</span>
                          <span className="sr-info-valor">
                            ${Number(solicitud.presupuesto_estimado).toLocaleString("es-MX")} MXN
                          </span>
                        </div>
                      )}
                      {solicitud.cliente_ciudad && (
                        <div className="sr-info-item">
                          <span className="sr-info-label">📍 Ciudad</span>
                          <span className="sr-info-valor">{solicitud.cliente_ciudad}</span>
                        </div>
                      )}
                      {solicitud.cliente_telefono && (
                        <div className="sr-info-item">
                          <span className="sr-info-label">📞 Teléfono</span>
                          <span className="sr-info-valor">{solicitud.cliente_telefono}</span>
                        </div>
                      )}
                    </div>

                    {solicitud.descripcion_solicitud && (
                      <div className="sr-descripcion">
                        <span className="sr-info-label">📝 Descripción</span>
                        <p className="sr-descripcion-texto">{solicitud.descripcion_solicitud}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer con botón de chat */}
                  <div className="sr-card-footer">
                    <button
                      className="sr-btn-chat"
                      onClick={() => abrirChat(solicitud.id_solicitud)}
                    >
                      💬 Abrir Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="sr-paginacion">
                <button
                  className="sr-pag-btn"
                  onClick={() => setPaginaActual((p) => p - 1)}
                  disabled={paginaActual === 0}
                >
                  ‹ Anterior
                </button>
                <span className="sr-pag-info">
                  {paginaActual + 1} / {totalPaginas}
                </span>
                <button
                  className="sr-pag-btn"
                  onClick={() => setPaginaActual((p) => p + 1)}
                  disabled={paginaActual >= totalPaginas - 1}
                >
                  Siguiente ›
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </ProveedorLayout>
  );
}

export default SolicitudesRecibidas;