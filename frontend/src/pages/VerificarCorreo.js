import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./VerificarCorreo.css";

/**
 * VerificarCorreo
 * ─────────────────────────────────────────────────────────────────────────────
 * El backend procesó la verificación con Firebase Admin y redirigió aquí con:
 *   ?exito=true              → verificación exitosa
 *   ?error=MENSAJE           → algo falló
 *
 * Esta página solo muestra el resultado — no llama a ninguna API.
 */
function VerificarCorreo() {
  const [searchParams] = useSearchParams();
  const exito = searchParams.get("exito") === "true";
  const error = searchParams.get("error");

  // ── Sin params = URL directa inválida ──────────────────────────────────
  if (!exito && !error) {
    return (
      <div className="verificar-page">
        <div className="verificar-card">
          <div className="verificar-icono verificar-icono-error">❌</div>
          <h1 className="verificar-titulo">Enlace inválido</h1>
          <p className="verificar-texto">
            Usa el enlace que recibiste en tu correo electrónico.
          </p>
          <div className="verificar-botones">
            <Link to="/login" className="verificar-btn verificar-btn-cliente">
              Ir al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (error) {
    const mensajes = {
      EXPIRED_OOB_CODE: "El enlace ha expirado. Vuelve a registrarte para recibir uno nuevo.",
      INVALID_OOB_CODE: "El enlace ya fue usado o no es válido.",
      ENLACE_INVALIDO:  "El enlace es inválido o está incompleto.",
      ERROR_SERVIDOR:   "Error del servidor. Intenta de nuevo más tarde.",
    };
    const mensaje = mensajes[error] || "No se pudo verificar el correo. Intenta de nuevo.";

    return (
      <div className="verificar-page">
        <div className="verificar-card">
          <div className="verificar-icono verificar-icono-error">❌</div>
          <h1 className="verificar-titulo">No se pudo verificar</h1>
          <p className="verificar-texto">{mensaje}</p>
          <div className="verificar-botones">
            <Link to="/login" className="verificar-btn verificar-btn-cliente">
              Ir al Login
            </Link>
            <Link to="/register" className="verificar-btn verificar-btn-secundario">
              Registrarse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────────────────
  return (
    <div className="verificar-page">
      <div className="verificar-card">
        <div className="verificar-icono">✅</div>
        <h1 className="verificar-titulo">¡Correo verificado!</h1>
        <p className="verificar-texto">
          Tu cuenta ha sido activada exitosamente. Ya puedes iniciar sesión.
        </p>
        <div className="verificar-info">
          Puedes cerrar esta pestaña o ir directamente al login.
        </div>
        <div className="verificar-botones">
          <Link to="/login" className="verificar-btn verificar-btn-cliente">
            Login Cliente
          </Link>
          <Link to="/login-proveedor" className="verificar-btn verificar-btn-proveedor">
            Login Proveedor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VerificarCorreo;