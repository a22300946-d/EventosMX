import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import { ModalConfirm, ModalAlert, useModal } from "../../components/modales";
import { FaHeartBroken, FaTrash, FaStar, FaMapMarkerAlt, FaRegHeart } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import "./Favoritos.css";

function Favoritos() {
  const navigate = useNavigate();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eliminando, setEliminando] = useState(false);

  const {
    modalConfirm,
    modalAlert,
    mostrarAlerta,
    mostrarConfirmacion,
    cerrarConfirm,
    cerrarAlert,
  } = useModal();

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    try {
      setLoading(true);
      const response = await clienteService.obtenerListaFavoritos();
      setFavoritos(response.data.data.proveedores || []);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarFavorito = (idListaProveedor, nombreProveedor) => {
    if (!idListaProveedor) {
      console.error('ID de lista_proveedor no definido');
      mostrarAlerta("Error", "ID no válido", "error");
      return;
    }

    mostrarConfirmacion({
      title: "Eliminar favorito",
      message: `¿Eliminar "${nombreProveedor}" de tus favoritos?`,
      confirmLabel: "Sí, eliminar",
      onConfirm: async () => {
        cerrarConfirm();
        try {
          setEliminando(true);
          await clienteService.eliminarDeFavoritos(idListaProveedor);
          setFavoritos(prev => prev.filter(f => f.id_lista_proveedor !== idListaProveedor));
        } catch (error) {
          console.error("Error al eliminar favorito:", error);
          mostrarAlerta("Error", "Error al eliminar de favoritos", "error");
        } finally {
          setEliminando(false);
        }
      },
    });
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
          <IoArrowBack /> Volver a mis eventos
        </button>

        <div className="favoritos-header-section">
          <div className="favoritos-info">
            <h1><FaRegHeart /> Proveedores Guardados</h1>
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
            <div className="empty-icon">
              <FaHeartBroken />
            </div>
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
            {favoritos.map((favorito) => (
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
                  <p className="favorito-ciudad">
                    <FaMapMarkerAlt /> {favorito.ciudad}
                  </p>
                  {favorito.calificacion_promedio && (
                    <div className="favorito-rating">
                      <FaStar /> {Number(favorito.calificacion_promedio * 5).toFixed(1)}
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
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalConfirm
        config={modalConfirm}
        onConfirm={modalConfirm?.onConfirm}
        onCancel={cerrarConfirm}
      />
      <ModalAlert
        config={modalAlert}
        onClose={cerrarAlert}
      />
    </ClienteLayout>
  );
}

export default Favoritos;