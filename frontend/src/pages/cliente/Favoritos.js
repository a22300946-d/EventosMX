import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./Favoritos.css";

function Favoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const response = await clienteService.obtenerListaFavoritos();
      console.log('Favoritos cargados:', response.data.data);
      setFavoritos(response.data.data.proveedores || []);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarFavorito = async (idListaProveedor, nombreProveedor) => {
    console.log('Intentando eliminar:', { idListaProveedor, nombreProveedor });
    
    if (!idListaProveedor) {
      console.error('ID de lista_proveedor no definido');
      alert("Error: ID no válido");
      return;
    }

    if (!window.confirm(`¿Eliminar "${nombreProveedor}" de tus favoritos?`)) {
      return;
    }

    try {
      setEliminando(true);
      
      await clienteService.eliminarDeFavoritos(idListaProveedor);
      
      setFavoritos(favoritos.filter(f => f.id_lista_proveedor !== idListaProveedor));
      
      console.log('Favorito eliminado correctamente');
    } catch (error) {
      console.error("Error al eliminar favorito:", error);
      alert("Error al eliminar de favoritos");
    } finally {
      setEliminando(false);
    }
  };

  const verPerfil = (idProveedor) => {
    navigate(`/perfil-proveedor/${idProveedor}`);
  };

  if (loading) {
    return (
      <ClienteLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando favoritos...</p>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="favoritos-container">
        <button className="btn-volver-simple" onClick={() => navigate("/cliente/listas")}>
          ← Volver a mis eventos
        </button>

        <div className="favoritos-header-section">
          <div className="favoritos-info">
            <h1>♡ Proveedores Guardados</h1>
            <p className="favoritos-desc">
              Todos tus proveedores favoritos en un solo lugar
            </p>
          </div>
          
          <div className="favoritos-resumen">
            <div className="resumen-item">
              <span className="resumen-numero">{favoritos.length}</span>
              <span className="resumen-label">Guardados</span>
            </div>
          </div>
        </div>

        {favoritos.length === 0 ? (
          <div className="empty-favoritos">
            <div className="empty-icon">💔</div>
            <h3>No tienes proveedores guardados</h3>
            <p>Explora y guarda tus proveedores favoritos</p>
            <button
              className="btn-explorar"
              onClick={() => navigate("/cliente/explorar")}
            >
              Explorar proveedores
            </button>
          </div>
        ) : (
          <div className="favoritos-lista">
            {favoritos.map((favorito) => {
              console.log('Renderizando favorito:', favorito);
              
              return (
                <div key={favorito.id_lista_proveedor} className="favorito-item">
                  <div className="favorito-imagen">
                    <img
                      src={favorito.logo || "https://via.placeholder.com/100"}
                      alt={favorito.nombre_negocio}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/100?text=Sin+Logo";
                      }}
                    />
                  </div>

                  <div className="favorito-info-detalle">
                    <h3>{favorito.nombre_negocio}</h3>
                    <p className="favorito-tipo">{favorito.tipo_servicio}</p>
                    <p className="favorito-ciudad">📍 {favorito.ciudad}</p>
                    {favorito.calificacion_promedio && (
                      <div className="favorito-rating">
                        ⭐ {Number(favorito.calificacion_promedio * 5).toFixed(1)}
                      </div>
                    )}
                  </div>

                  <div className="favorito-acciones">
                    <button
                      className="btn-ver-perfil"
                      onClick={() => verPerfil(favorito.id_proveedor)}
                    >
                      Ver perfil
                    </button>

                    <button
                      className="btn-eliminar"
                      onClick={() => eliminarFavorito(
                        favorito.id_lista_proveedor, 
                        favorito.nombre_negocio
                      )}
                      disabled={eliminando}
                      title="Eliminar de favoritos"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default Favoritos;