import React from "react";
import { Link } from "react-router-dom";

function VerificarCorreo() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f4f4f4",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "50px 40px",
        maxWidth: "480px",
        width: "90%",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <div style={{ fontSize: "72px", marginBottom: "20px" }}>✅</div>
        <h1 style={{ color: "#1a4d5c", marginBottom: "15px" }}>
          ¡Correo verificado!
        </h1>
        <p style={{ color: "#555", marginBottom: "30px", lineHeight: "1.6" }}>
          Tu cuenta ha sido activada exitosamente. 
          Ya puedes cerrar esta pestaña y volver a la aplicación para iniciar sesión.
        </p>
        <div style={{
          background: "#f0f7f9",
          border: "1px solid #c8e0e8",
          borderRadius: "8px",
          padding: "15px",
          fontSize: "14px",
          color: "#555",
          marginBottom: "30px"
        }}>
          Puedes cerrar esta pestaña o ir directamente al login.
        </div>
        <Link to="/login" style={{
          display: "inline-block",
          background: "#1a4d5c",
          color: "white",
          padding: "14px 30px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "bold"
        }}>
          Ir al Login
        </Link>
      </div>
    </div>
  );
}

export default VerificarCorreo;