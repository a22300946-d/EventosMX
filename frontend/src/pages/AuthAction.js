import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

/**
 * AuthAction
 * ─────────────────────────────────────────────────────────────────────────────
 * Página intermediaria que recibe todos los links de acción de Firebase.
 * Firebase Console tiene una sola "URL de acción personalizada", que apunta
 * aquí: /auth-action
 *
 * Firebase añade automáticamente los params:
 *   ?mode=verifyEmail&oobCode=XXX&apiKey=YYY   → verificación de cuenta
 *   ?mode=resetPassword&oobCode=XXX&apiKey=YYY → reset de contraseña
 *
 * Esta página simplemente lee el mode y redirige conservando todos los params.
 */
function AuthAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const mode    = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");
    const apiKey  = searchParams.get("apiKey");

    // Construir query string completo para pasarlo a la página destino
    const query = `?oobCode=${oobCode}&apiKey=${apiKey}`;

    if (mode === "verifyEmail") {
      navigate(`/verificar-correo${query}`, { replace: true });
    } else if (mode === "resetPassword") {
      navigate(`/restablecer-contrasena${query}`, { replace: true });
    } else {
      // mode desconocido → ir al login
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  // Muestra algo mientras redirige (fracción de segundo)
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f4f4f4",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <p style={{ color: "#6c757d", fontSize: "1rem" }}>Cargando...</p>
      </div>
    </div>
  );
}

export default AuthAction;