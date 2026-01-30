import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SplitAuthLayout from "../components/SplitAuthLayout";

function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(correo, contrasena, "cliente");

    if (result.success) {
      const redirectTo = location.state?.redirectTo || "/";
      navigate(redirectTo);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <SplitAuthLayout
      title="Accede a tu cuenta"
      subtitle="Completa el formulario con los datos de tu cuenta"
      heroTitle="TU EVENTO IDEAL EMPIEZA AQUÍ"
    >
      {/* Mostrar mensaje si viene de una búsqueda */}
      {location.state?.message && (
        <div
          style={{
            backgroundColor: "#d1ecf1",
            color: "#0c5460",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            marginBottom: "1rem",
            border: "1px solid #bee5eb",
          }}
        >
          {location.state.message}
        </div>
      )}
      <div className="form-link" style={{ marginBottom: "1rem" }}>
        ¿Aún no tienes una cuenta? <Link to="/register">Regístrate</Link>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            className="form-input"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Accediendo..." : "Acceder"}
        </button>
      </form>

      <div className="form-link" style={{ marginTop: "1rem" }}>
        <Link to="/forgot-password">Olvidé mi contraseña</Link>
      </div>

      <div className="form-divider">¿Eres profesional?</div>

      <div className="form-link">
        <Link to="/login-proveedor">Acceso para profesionales</Link>
      </div>
    </SplitAuthLayout>
  );
}

export default Login;
