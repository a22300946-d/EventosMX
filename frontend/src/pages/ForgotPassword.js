import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SplitAuthLayout from "../components/SplitAuthLayout";
import "./ForgotPassword.css";
import { FaEnvelope, FaLightbulb } from 'react-icons/fa';

/**
 * ForgotPassword
 * Página unificada de recuperación de contraseña para clientes y proveedores.
 * Detecta el tipo de cuenta con el query param ?tipo=proveedor.
 *
 * Flujo:
 *  1. Usuario escribe su correo y envía el formulario.
 *  2. El backend llama a Firebase generatePasswordResetLink y envía el enlace.
 *  3. Firebase abre una nueva pestaña donde el usuario escribe su nueva contraseña.
 *  4. Firebase redirige a /restablecer-contrasena al terminar.
 */
function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo") === "proveedor" ? "proveedor" : "cliente";

  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  const endpoint =
    tipo === "proveedor"
      ? `${API_BASE}/proveedores/recuperar-contrasena`
      : `${API_BASE}/clientes/recuperar-contrasena`;

  const loginHref = tipo === "proveedor" ? "/login-proveedor" : "/login";
  const titulo =
    tipo === "proveedor"
      ? "Recupera tu acceso de negocio"
      : "Recupera tu contraseña";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo }),
      });
      // Siempre mostramos éxito por seguridad (no revelamos si existe el correo)
      setEnviado(true);
    } catch (err) {
      setError("Ocurrió un error. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthLayout
      title={titulo}
      subtitle="Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña"
      heroTitle="RECUPERA EL ACCESO A TU CUENTA"
    >
      {!enviado ? (
        <>
          <div className="form-link" style={{ marginBottom: "1rem" }}>
            ¿Recuerdas tu contraseña? <Link to={loginHref}>Inicia sesión</Link>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                className="form-input"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>

          <div className="form-divider">
            {tipo === "proveedor" ? "¿Eres cliente?" : "¿Eres proveedor?"}
          </div>

          <div className="form-link">
            {tipo === "proveedor" ? (
              <Link to="/forgot-password">Recuperar cuenta de cliente</Link>
            ) : (
              <Link to="/forgot-password?tipo=proveedor">
                Recuperar cuenta de proveedor
              </Link>
            )}
          </div>
        </>
      ) : (
        /* ── Pantalla de confirmación de envío ── */
        <div className="forgot-confirmacion">
<div className="forgot-icono"><FaEnvelope /></div>

          <h3 className="forgot-confirmacion-titulo">Revisa tu correo</h3>

          <p className="forgot-confirmacion-texto">
            Si <strong>{correo}</strong> está registrado, recibirás un enlace
            para restablecer tu contraseña. El enlace abrirá una nueva pestaña
            donde podrás crear tu nueva contraseña.
          </p>

          <div className="forgot-tips">
<strong><FaLightbulb /> Consejos:</strong>
            <ul>
              <li>Revisa también tu carpeta de spam.</li>
              <li>El enlace expira en 1 hora.</li>
              <li>
                Puedes cerrar esta pestaña una vez que hayas cambiado tu
                contraseña.
              </li>
            </ul>
          </div>

          <Link to={loginHref} className="forgot-btn-login">
            Volver al Login
          </Link>

          <button
            className="forgot-btn-reintentar"
            onClick={() => {
              setEnviado(false);
              setCorreo("");
            }}
          >
            Intentar con otro correo
          </button>
        </div>
      )}
    </SplitAuthLayout>
  );
}

export default ForgotPassword;