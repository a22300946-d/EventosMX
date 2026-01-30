import React, { useState, useEffect } from "react";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import "./Preferencias.css";

function Preferencias() {
  const [formData, setFormData] = useState({
    tipos_eventos: "",
    servicios_preferidos: "",
    ubicacion_preferida: "",
    precio_min: "",
    precio_max: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular guardado (aquí conectarías con la API)
    setTimeout(() => {
      setMensaje({
        tipo: "success",
        texto: "Preferencias guardadas exitosamente",
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <ClienteLayout>
      <div className="preferencias-container">
        <h1>Preferencias</h1>

        <form onSubmit={handleSubmit} className="preferencias-form">
          <div className="form-group">
            <input
              type="text"
              name="tipos_eventos"
              className="form-input"
              placeholder="Tipos de eventos de interés"
              value={formData.tipos_eventos}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="servicios_preferidos"
              className="form-input"
              placeholder="Servicios preferidos"
              value={formData.servicios_preferidos}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              name="ubicacion_preferida"
              className="form-input"
              placeholder="Ubicación preferida de búsqueda"
              value={formData.ubicacion_preferida}
              onChange={handleChange}
            />
          </div>

          <div className="precio-section">
            <h3>Rango de precios</h3>
            <div className="precio-inputs">
              <input
                type="number"
                name="precio_min"
                className="form-input"
                placeholder="Mínimo"
                value={formData.precio_min}
                onChange={handleChange}
              />
              <input
                type="number"
                name="precio_max"
                className="form-input"
                placeholder="Máximo"
                value={formData.precio_max}
                onChange={handleChange}
              />
            </div>
          </div>

          {mensaje.texto && (
            <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
          )}

          <button type="submit" className="btn-guardar" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>
    </ClienteLayout>
  );
}

export default Preferencias;
