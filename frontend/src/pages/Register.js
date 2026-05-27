import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SplitAuthLayout from "../components/SplitAuthLayout";
import api from "../services/api";
import PasswordInput from "../components/PasswordInput";
import { MdEmail, MdWarning, MdError } from "react-icons/md";

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
  const [registrado, setRegistrado] = useState(false);
  const [correoEnviado, setCorreoEnviado] = useState("");
  const [errores, setErrores] = useState({});

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

  const validarNombreCompleto = (valor) => {
    if (!valor.trim()) return "El nombre completo es obligatorio";
    if (valor.length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (valor.length > 100) return "El nombre no puede exceder 100 caracteres";
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(valor)) return "El nombre solo puede contener letras y espacios";
    const palabras = valor.trim().split(/\s+/);
    if (palabras.length < 2) return "Debes ingresar nombre y apellido";
    return "";
  };

  const validarCorreo = (valor) => {
    if (!valor.trim()) return "El correo es obligatorio";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(valor)) return "Ingresa un correo válido";
    return "";
  };

  const validarContrasena = (valor) => {
    if (!valor) return "La contraseña es obligatoria";
    if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (valor.length > 50) return "La contraseña no puede exceder 50 caracteres";
    if (!/[A-Z]/.test(valor)) return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(valor)) return "La contraseña debe contener al menos una minúscula";
    if (!/\d/.test(valor)) return "La contraseña debe contener al menos un número";
    return "";
  };

  const validarTelefono = (valor) => {
    if (!valor.trim()) return "";
    const telefonoLimpio = valor.replace(/[\s\-()]/g, "");
    if (!/^\d+$/.test(telefonoLimpio)) return "El teléfono debe contener solo números";
    if (telefonoLimpio.length !== 10) return "El teléfono debe tener 10 dígitos";
    return "";
  };

  const validarCampo = (nombre, valor) => {
    switch (nombre) {
      case "nombre_completo": return validarNombreCompleto(valor);
      case "correo": return validarCorreo(valor);
      case "contrasena": return validarContrasena(valor);
      case "confirmar_contrasena":
        if (!valor) return "Debes confirmar tu contraseña";
        if (valor !== formData.contrasena) return "Las contraseñas no coinciden";
        return "";
      case "telefono": return validarTelefono(valor);
      case "ciudad": return !valor ? "Debes seleccionar una ciudad" : "";
      default: return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorProcesado = value;

    if (name === "nombre_completo") {
      valorProcesado = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      if (valorProcesado.length > 100) return;
    }

    if (name === "telefono") {
      valorProcesado = value.replace(/[^\d\s\-()]/g, "");
      const soloNumeros = valorProcesado.replace(/[\s\-()]/g, "");
      if (soloNumeros.length > 10) return;
    }

    if ((name === "contrasena" || name === "confirmar_contrasena") && value.length > 50) return;

    setFormData({ ...formData, [name]: valorProcesado });
    setErrores({ ...errores, [name]: validarCampo(name, valorProcesado) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const nuevosErrores = {
      nombre_completo: validarNombreCompleto(formData.nombre_completo),
      correo: validarCorreo(formData.correo),
      contrasena: validarContrasena(formData.contrasena),
      confirmar_contrasena: validarCampo("confirmar_contrasena", formData.confirmar_contrasena),
      telefono: validarTelefono(formData.telefono),
      ciudad: formData.ciudad ? "" : "Debes seleccionar una ciudad",
    };

    const erroresActivos = Object.entries(nuevosErrores).filter(([_, v]) => v !== "");

    if (erroresActivos.length > 0) {
      setErrores(nuevosErrores);
      setError("Por favor corrige los errores antes de continuar");
      setLoading(false);
      return;
    }

    setErrores({});

    const datos = {
      nombre_completo: formData.nombre_completo.trim(),
      correo: formData.correo.trim(),
      contrasena: formData.contrasena,
      telefono: formData.telefono.replace(/[\s\-()]/g, ""),
      ciudad: formData.ciudad,
    };

    const result = await register(datos, "cliente");

    if (result.success) {
      setCorreoEnviado(formData.correo);
      setRegistrado(true);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  if (registrado) {
    return (
      <SplitAuthLayout
        title="¡Casi listo!"
        subtitle="Solo falta un paso"
        heroTitle="TU EVENTO IDEAL EMPIEZA AQUÍ"
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px", color: "#1a4d5c" }}>
            <MdEmail />
          </div>
          <h2 style={{ color: "#1a4d5c", marginBottom: "15px" }}>
            Revisa tu correo
          </h2>
          <p style={{ color: "#555", marginBottom: "10px" }}>
            Enviamos un enlace de verificación a:
          </p>
          <p style={{ fontWeight: "bold", color: "#1a4d5c", fontSize: "16px", marginBottom: "25px" }}>
            {correoEnviado}
          </p>
          <p style={{ color: "#777", fontSize: "14px", marginBottom: "30px" }}>
            Haz clic en el enlace del correo para activar tu cuenta.
            El enlace expira en 24 horas.
          </p>
          <div style={{
            background: "#f0f7f9",
            border: "1px solid #c8e0e8",
            borderRadius: "8px",
            padding: "15px",
            fontSize: "13px",
            color: "#555"
          }}>
            ¿No lo ves? Revisa tu carpeta de <strong>spam</strong> o correo no deseado.
          </div>
          <div style={{ marginTop: "25px" }}>
            <Link to="/login" style={{ color: "#1a4d5c", fontSize: "14px" }}>
              ¿Ya verificaste? Inicia sesión aquí
            </Link>
          </div>
        </div>
      </SplitAuthLayout>
    );
  }

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
            className={`form-input ${errores.nombre_completo ? "input-error" : ""}`}
            placeholder="Nombre y Apellidos"
            value={formData.nombre_completo}
            onChange={handleChange}
            required
          />
          {errores.nombre_completo && (
            <span className="error-message">
              <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
              {errores.nombre_completo}
            </span>
          )}
          <small className="field-hint">
            {formData.nombre_completo.length}/100 caracteres - Solo letras
          </small>
        </div>

        <div className="form-group">
          <input
            type="email"
            name="correo"
            className={`form-input ${errores.correo ? "input-error" : ""}`}
            placeholder="Email"
            value={formData.correo}
            onChange={handleChange}
            required
          />
          {errores.correo && (
            <span className="error-message">
              <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
              {errores.correo}
            </span>
          )}
        </div>

        <div className="form-group">
          <PasswordInput
            name="contrasena"
            placeholder="Genera una contraseña"
            value={formData.contrasena}
            onChange={handleChange}
            className={errores.contrasena ? "input-error" : ""}
            required
          />
          {errores.contrasena && (
            <span className="error-message">
              <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
              {errores.contrasena}
            </span>
          )}
          <small className="field-hint">
            Mínimo 8 caracteres, mayúsculas, minúsculas y números
          </small>
        </div>

        <div className="form-group">
          <PasswordInput
            name="confirmar_contrasena"
            placeholder="Confirma tu contraseña"
            value={formData.confirmar_contrasena}
            onChange={handleChange}
            className={errores.confirmar_contrasena ? "input-error" : ""}
            required
          />
          {errores.confirmar_contrasena && (
            <span className="error-message">
              <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
              {errores.confirmar_contrasena}
            </span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <input
              type="tel"
              name="telefono"
              className={`form-input ${errores.telefono ? "input-error" : ""}`}
              placeholder="Teléfono (10 dígitos)"
              value={formData.telefono}
              onChange={handleChange}
              maxLength="14"
            />
            {errores.telefono && (
              <span className="error-message">
                <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
                {errores.telefono}
              </span>
            )}
            <small className="field-hint">Ejemplo: 3312345678</small>
          </div>

          <div className="form-group">
            <select
              name="ciudad"
              className={`form-input form-select ${errores.ciudad ? "input-error" : ""}`}
              value={formData.ciudad}
              onChange={handleChange}
              required
              style={{ color: formData.ciudad === "" ? "#adb5bd" : "#495057" }}
            >
              <option value="" disabled hidden>Selecciona tu ciudad</option>
              {ciudades.map((lugar) => (
                <option key={lugar.id_lugar} value={lugar.ciudad}>
                  {lugar.ciudad}
                </option>
              ))}
            </select>
            {errores.ciudad && (
              <span className="error-message">
                <MdWarning style={{ verticalAlign: "middle", marginRight: "4px" }} />
                {errores.ciudad}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <MdError style={{ verticalAlign: "middle", marginRight: "4px" }} />
            {error}
          </div>
        )}

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