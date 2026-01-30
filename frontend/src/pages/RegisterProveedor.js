import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SplitAuthLayout from "../components/SplitAuthLayout";
import api from "../services/api";

function RegisterProveedor() {
  const [ciudades, setCiudades] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    nombre_negocio: "",
    correo: "",
    contrasena: "",
    confirmar_contrasena: "",
    telefono: "",
    ciudad: "",
    tipo_servicio: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    cargarCategorias();
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

  const cargarCategorias = async () => {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
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

    if (!formData.tipo_servicio) {
      setError("Por favor selecciona un tipo de servicio");
      return;
    }

    if (!formData.ciudad) {
      setError("Por favor selecciona una ciudad");
      return;
    }

    setLoading(true);

    const datos = {
      nombre_negocio: formData.nombre_negocio,
      correo: formData.correo,
      contrasena: formData.contrasena,
      telefono: formData.telefono,
      ciudad: formData.ciudad,
      tipo_servicio: formData.tipo_servicio,
      descripcion: "",
    };

    const result = await register(datos, "proveedor");

    if (result.success) {
      navigate("/proveedor/dashboard");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <SplitAuthLayout
      title="Registro Profesionales"
      subtitle="Completa el formulario para empezar a brindar tus servicios"
      heroTitle="TU NEGOCIO DE EVENTOS, A OTRO NIVEL"
    >
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            type="text"
            name="nombre_negocio"
            className="form-input"
            placeholder="Nombre del negocio"
            value={formData.nombre_negocio}
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

        <div className="form-group">
          <select
            name="tipo_servicio"
            className="form-input form-select"
            value={formData.tipo_servicio}
            onChange={handleChange}
            required
            style={{
              color: formData.tipo_servicio === "" ? "#adb5bd" : "#495057",
            }}
          >
            <option value="" disabled hidden>
              Selecciona el tipo de servicio
            </option>
            {categorias.map((categoria) => (
              <option
                key={categoria.id_categoria}
                value={categoria.nombre_categoria}
              >
                {categoria.nombre_categoria}
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
        ¿Ya tienes una cuenta?{" "}
        <Link to="/login-proveedor">Acceso para profesionales</Link>
      </div>
    </SplitAuthLayout>
  );
}

export default RegisterProveedor;
