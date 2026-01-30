import React, { useState, useEffect } from "react";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import "./ResenasPublicadas.css";

function ResenasPublicadas() {
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de reseñas
    setTimeout(() => {
      setResenas([
        {
          id: 1,
          proveedor: "Fotografía y Video Zaragoza",
          comentario:
            "Muy buen servicio, atentos y responden casi al instante.",
          calificacion: 5,
          sentimiento: "positivo",
        },
        {
          id: 2,
          proveedor: "DJ Máster",
          comentario:
            "Son unos estúpidos que solo contestan cuando quieren, además llegan cuando se les da la maldita gana, ojalá nadie los contrate.",
          calificacion: 1,
          sentimiento: "negativo",
          eliminada: true,
        },
        {
          id: 3,
          proveedor: "DJ Máster",
          comentario:
            "Son groseros y casi nunca contestan, además llegan tarde y no otorgan compensación ante el retraso, no los volvería a contratar.",
          calificacion: 1,
          sentimiento: "negativo",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    for (let i = 0; i < 5; i++) {
      estrellas.push(
        <span
          key={i}
          className={i < calificacion ? "estrella-llena" : "estrella-vacia"}
        >
          ⭐
        </span>,
      );
    }
    return estrellas;
  };

  const getBadge = (sentimiento) => {
    if (sentimiento === "positivo") {
      return { class: "badge-positivo", text: "Reseña positiva" };
    }
    return { class: "badge-negativo", text: "Reseña negativa" };
  };

  return (
    <ClienteLayout>
      <div className="resenas-container">
        <h1>Reseñas publicadas</h1>

        {loading ? (
          <p>Cargando reseñas...</p>
        ) : resenas.length === 0 ? (
          <p>No has publicado reseñas aún.</p>
        ) : (
          <div className="resenas-list">
            {resenas.map((resena) => {
              const badge = getBadge(resena.sentimiento);
              return (
                <div key={resena.id} className="resena-card">
                  <div className="resena-header">
                    <div>
                      <h3>{resena.proveedor}</h3>
                      <div className="estrellas">
                        {renderEstrellas(resena.calificacion)}
                      </div>
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </div>

                  {resena.eliminada && (
                    <p className="advertencia">
                      *Reseña eliminada por el administrador
                    </p>
                  )}

                  <p className="resena-comentario">{resena.comentario}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default ResenasPublicadas;
