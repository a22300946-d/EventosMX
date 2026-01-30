import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SplitAuthLayout from "../components/SplitAuthLayout";
import api from "../services/api";

function Register() {
  const [ciudades, setCiudades] = useState([]);
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "",
    contrasena: "",
    confirmar_contrasena: "",
    telefono: "",
    ciudad: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarCiudades();
  }, []);

  const cargarCiudades = async () => {
    try {
      const response = await api.get("/lugar");
      setCiudades(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
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
    setError("");

    if (formData.contrasena !== formData.confirmar_contrasena) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const datos = {
      nombre_completo: formData.nombre_completo,
      correo: formData.correo,
      contrasena: formData.contrasena,
      telefono: formData.telefono,
      ciudad: formData.ciudad,
    };

    const result = await register(datos, "cliente");

    if (result.success) {
      navigate("/cliente/dashboard");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <SplitAuthLayout
      title="Registro de usuarios"
      subtitle="Completa el formulario para seguir con tu registro"
      heroTitle="TU EVENTO IDEAL EMPIEZA AQUÍ"
    >
      <form onSubmit={handleSubmit} className="auth-form">
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
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="contrasena"
            className="form-input"
            placeholder="Genera una contraseña"
            value={formData.contrasena}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            name="confirmar_contrasena"
            className="form-input"
            placeholder="Confirma tu contraseña"
            value={formData.confirmar_contrasena}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <input
            type="tel"
            name="telefono"
            className="form-input"
            placeholder="Teléfono"
            value={formData.telefono}
            onChange={handleChange}
          />

          <select
            name="ciudad"
            className="form-input form-select"
            value={formData.ciudad}
            onChange={handleChange}
            required
            style={{
              color: formData.ciudad === "" ? "#adb5bd" : "#495057",
            }}
          >
            <option value="" disabled hidden>
              Selecciona tu ciudad
            </option>

            {ciudades.map((lugar) => (
              <option key={lugar.id_lugar} value={lugar.ciudad}>
                {lugar.ciudad}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Registrando..." : "Registrarme"}
        </button>
      </form>

      <div className="form-link">
        ¿Ya tienes una cuenta? <Link to="/login">Accede aquí</Link>
      </div>

      <div className="form-divider">¿Quieres registar un negocio?</div>

      <div className="form-link">
        <Link to="/register-proveedor">Registro de profesionales</Link>
      </div>
    </SplitAuthLayout>
  );
}

export default Register;
