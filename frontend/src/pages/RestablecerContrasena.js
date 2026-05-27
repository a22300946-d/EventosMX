import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import {
  AiOutlineLoading3Quarters,
  AiOutlineCloseCircle,
  AiOutlineCheckCircle,
  AiOutlineLock,
  AiOutlineWarning,
} from "react-icons/ai";
import "./RestablecerContrasena.css";

/**
 * RestablecerContrasena
 * ─────────────────────────────────────────────────────────────────────────────
 * Flujo:
 *  1. Lee oobCode y apiKey de la URL (enviados por el backend desde /api/auth/accion)
 *  2. Verifica que el oobCode sea válido con Firebase REST API
 *  3. Al guardar: cambia contraseña en Firebase Y sincroniza en la BD propia
 */
function RestablecerContrasena() {
  const [searchParams] = useSearchParams();

  const oobCode = searchParams.get("oobCode");
  const apiKey  = searchParams.get("apiKey");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const [estado, setEstado]               = useState("cargando");
  const [correoUsuario, setCorreoUsuario] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmar, setConfirmar]         = useState("");
  const [errorMsg, setErrorMsg]           = useState("");
  const [errores, setErrores]             = useState({});
  const [loading, setLoading]             = useState(false);

  // ── Validaciones ────────────────────────────────────────────────────────
  const validarContrasena = (valor) => {
    if (!valor) return "La contraseña es obligatoria";
    if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (valor.length > 50) return "La contraseña no puede exceder 50 caracteres";
    if (!/[A-Z]/.test(valor)) return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(valor)) return "La contraseña debe contener al menos una minúscula";
    if (!/\d/.test(valor)) return "La contraseña debe contener al menos un número";
    return "";
  };

  const validarConfirmar = (valor, base) => {
    if (!valor) return "Debes confirmar tu contraseña";
    if (valor !== base) return "Las contraseñas no coinciden";
    return "";
  };

  // ── Verificar oobCode al montar ─────────────────────────────────────────
  useEffect(() => {
    if (!oobCode || !apiKey) {
      setEstado("error");
      setErrorMsg("El enlace es inválido o está incompleto. Solicita uno nuevo.");
      return;
    }

    const verificarCodigo = async () => {
      try {
        const res  = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ oobCode }),
          }
        );
        const data = await res.json();

        if (data.error) {
          setEstado("error");
          setErrorMsg(
            data.error.message === "EXPIRED_OOB_CODE"
              ? "El enlace ha expirado. Solicita uno nuevo."
              : data.error.message === "INVALID_OOB_CODE"
              ? "El enlace ya fue usado o es inválido. Solicita uno nuevo."
              : "El enlace no es válido. Solicita uno nuevo."
          );
        } else {
          setCorreoUsuario(data.email || "");
          setEstado("formulario");
        }
      } catch (err) {
        setEstado("error");
        setErrorMsg("Error de conexión. Inténtalo de nuevo.");
      }
    };

    verificarCodigo();
  }, [oobCode, apiKey]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleNuevaContrasena = (e) => {
    const valor = e.target.value;
    if (valor.length > 50) return;
    setNuevaContrasena(valor);
    setErrores((prev) => ({
      ...prev,
      nuevaContrasena: validarContrasena(valor),
      confirmar: confirmar ? validarConfirmar(confirmar, valor) : prev.confirmar,
    }));
  };

  const handleConfirmar = (e) => {
    const valor = e.target.value;
    if (valor.length > 50) return;
    setConfirmar(valor);
    setErrores((prev) => ({
      ...prev,
      confirmar: validarConfirmar(valor, nuevaContrasena),
    }));
  };

  // ── Guardar nueva contraseña ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validar todos los campos antes de enviar
    const errNueva    = validarContrasena(nuevaContrasena);
    const errConfirmar = validarConfirmar(confirmar, nuevaContrasena);

    if (errNueva || errConfirmar) {
      setErrores({ nuevaContrasena: errNueva, confirmar: errConfirmar });
      setErrorMsg("Por favor corrige los errores antes de continuar.");
      return;
    }

    setLoading(true);
    try {
      // 1. Cambiar contraseña en Firebase
      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oobCode, newPassword: nuevaContrasena }),
        }
      );
      const firebaseData = await firebaseRes.json();

      if (firebaseData.error) {
        setErrorMsg(
          firebaseData.error.message === "EXPIRED_OOB_CODE"
            ? "El enlace ha expirado. Solicita uno nuevo."
            : "Ocurrió un error al cambiar la contraseña. Inténtalo de nuevo."
        );
        setLoading(false);
        return;
      }

      // 2. Sincronizar contraseña en la base de datos propia
      const correo = firebaseData.email || correoUsuario;
      await fetch(`${API_BASE}/auth/actualizar-contrasena`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, nuevaContrasena }),
      });

      // Éxito aunque falle el sync (Firebase ya actualizó)
      setEstado("exito");
    } catch (err) {
      setErrorMsg("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Cargando ────────────────────────────────────────────────────────────
  if (estado === "cargando") {
    return (
      <div className="restablecer-page">
        <div className="restablecer-card">
          <div className="restablecer-spinner">
            <AiOutlineLoading3Quarters className="spin-icon" />
          </div>
          <p className="restablecer-cargando-texto">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────
  if (estado === "error") {
    return (
      <div className="restablecer-page">
        <div className="restablecer-card">
          <div className="restablecer-icono restablecer-icono-error">
            <AiOutlineCloseCircle />
          </div>
          <h1 className="restablecer-titulo">Enlace inválido</h1>
          <p className="restablecer-texto">{errorMsg}</p>
          <Link to="/forgot-password" className="restablecer-btn restablecer-btn-cliente">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  // ── Éxito ───────────────────────────────────────────────────────────────
  if (estado === "exito") {
    return (
      <div className="restablecer-page">
        <div className="restablecer-card">
          <div className="restablecer-icono">
            <AiOutlineCheckCircle />
          </div>
          <h1 className="restablecer-titulo">¡Contraseña restablecida!</h1>
          <p className="restablecer-texto">
            Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar
            sesión con tu nueva contraseña.
          </p>
          <div className="restablecer-info">
            <strong>¿Qué sigue?</strong>
            <ul>
              <li>Puedes cerrar esta pestaña.</li>
              <li>Ve al login e ingresa con tu nueva contraseña.</li>
            </ul>
          </div>
          <div className="restablecer-botones">
            <Link to="/login" className="restablecer-btn restablecer-btn-cliente">
              Login Cliente
            </Link>
            <Link to="/login-proveedor" className="restablecer-btn restablecer-btn-proveedor">
              Login Proveedor
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Formulario ──────────────────────────────────────────────────────────
  return (
    <div className="restablecer-page">
      <div className="restablecer-card">
        <div className="restablecer-icono">
          <AiOutlineLock />
        </div>
        <h1 className="restablecer-titulo">Nueva contraseña</h1>

        {correoUsuario && (
          <p className="restablecer-correo">para {correoUsuario}</p>
        )}

        <form onSubmit={handleSubmit} className="restablecer-form">
          <div className="restablecer-field">
            <PasswordInput
              value={nuevaContrasena}
              onChange={handleNuevaContrasena}
              placeholder="Nueva contraseña"
              className={errores.nuevaContrasena ? "input-error" : ""}
              required
            />
            {errores.nuevaContrasena && (
              <span className="error-message">
                <AiOutlineWarning /> {errores.nuevaContrasena}
              </span>
            )}
            <small className="field-hint">
              Mínimo 8 caracteres, mayúsculas, minúsculas y números
            </small>
          </div>

          <div className="restablecer-field">
            <PasswordInput
              value={confirmar}
              onChange={handleConfirmar}
              placeholder="Confirmar contraseña"
              className={errores.confirmar ? "input-error" : ""}
              required
            />
            {errores.confirmar && (
              <span className="error-message">
                <AiOutlineWarning /> {errores.confirmar}
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="restablecer-error">
              <AiOutlineWarning /> {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="restablecer-submit"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RestablecerContrasena;