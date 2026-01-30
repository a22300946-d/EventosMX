import React, { useState, useEffect } from "react";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import { useAuth } from "../../hooks/useAuth";
import "./EditarDatos.css";

function EditarDatos() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    ciudad: "",
    nueva_contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const response = await clienteService.obtenerPerfil();
      const datos = response.data.data;
      setFormData({
        nombre_completo: datos.nombre_completo || "",
        correo: datos.correo || "",
        telefono: datos.telefono || "",
        ciudad: datos.ciudad || "",
        nueva_contrasena: "",
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      const datosActualizar = {
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
      };

      await clienteService.actualizarPerfil(datosActualizar);

      setMensaje({
        tipo: "success",
        texto: "Datos actualizados exitosamente",
      });

      // Actualizar localStorage
      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
        }),
      );
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || "Error al actualizar datos",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClienteLayout>
      <div className="editar-datos-container">
        <h1>Editar mis datos personales</h1>

        <div className="editar-datos-content">
          <div className="avatar-section">
            <div className="avatar-circle">
              <svg viewBox="0 0 100 100" width="200" height="200">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="#8ba9b5"
                  stroke="#6b8a96"
                  strokeWidth="2"
                />
                <circle cx="50" cy="40" r="18" fill="white" />
                <path d="M 25 75 Q 25 55, 50 55 Q 75 55, 75 75" fill="white" />
              </svg>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="datos-form">
            <div className="form-group">
              <input
                type="text"
                name="nombre_completo"
                className="form-input"
                placeholder="Nombre y Apellidos"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="correo"
                className="form-input"
                placeholder="Email"
                value={formData.correo}
                disabled
                style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="telefono"
                className="form-input"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                name="ciudad"
                className="form-input"
                placeholder="Ubicación"
                value={formData.ciudad}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="nueva_contrasena"
                className="form-input"
                placeholder="Nueva Contraseña"
                value={formData.nueva_contrasena}
                onChange={handleChange}
              />
            </div>

            {mensaje.texto && (
              <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}

            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </ClienteLayout>
  );
}

export default EditarDatos;
