import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { useNavigate } from "react-router-dom";
import "./SolicitudesRecibidas.css";

function SolicitudesRecibidas() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
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
    navigate(`/proveedor/chat/${idSolicitud}`);
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <ProveedorLayout>
      <div className="solicitudes-recibidas-container">
        <h1>Mis solicitudes</h1>

        {loading ? (
          <p>Cargando solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <p>No has recibido solicitudes aun.</p>
        ) : (
          <div className="solicitudes-list">
            {solicitudes.map((solicitud) => (
              <div
                key={solicitud.id_solicitud}
                className="solicitud-recibida-card"
              >
                <div className="solicitud-info">
                  <h3>{solicitud.tipo_evento || "Evento"}</h3>
                  <p className="solicitud-fecha">
                    Fecha: {formatearFecha(solicitud.fecha_evento)}
                  </p>
                  <p className="solicitud-servicio">
                    Servicio: {solicitud.tipo_servicio || "General"}
                  </p>
                </div>
                <button
                  className="btn-abrir-chat"
                  onClick={() => abrirChat(solicitud.id_solicitud)}
                >
                  Abrir chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProveedorLayout>
  );
}

export default SolicitudesRecibidas;
