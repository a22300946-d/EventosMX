import React, { useState, useEffect } from "react";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./HistorialSolicitudes.css";

function HistorialSolicitudes() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const response = await clienteService.obtenerMisSolicitudes();
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      Aceptada: "badge-success",
      Pendiente: "badge-warning",
      Cancelada: "badge-danger",
      Respondida: "badge-info",
    };
    return badges[estado] || "badge-default";
  };

  return (
    <ClienteLayout>
      <div className="historial-container">
        <h1>Historial de solicitudes</h1>

        {loading ? (
          <p>Cargando solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <p>No tienes solicitudes aún.</p>
        ) : (
          <div className="solicitudes-list">
            {solicitudes.map((solicitud) => (
              <div key={solicitud.id_solicitud} className="solicitud-card">
                <div className="solicitud-header">
                  <h3>{solicitud.nombre_negocio}</h3>
                  <span className={`badge ${getEstadoBadge(solicitud.estado)}`}>
                    {solicitud.estado === "Aceptada" && "Cotización aceptada"}
                    {solicitud.estado === "Pendiente" && "Cotización pendiente"}
                    {solicitud.estado === "Cancelada" && "Solicitud Cancelada"}
                    {solicitud.estado === "Respondida" &&
                      "Cotización respondida"}
                  </span>
                </div>
                <div className="solicitud-categoria">
                  <span className="categoria-badge">
                    {solicitud.tipo_servicio}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default HistorialSolicitudes;
