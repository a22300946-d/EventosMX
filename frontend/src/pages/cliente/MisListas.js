import React, { useState, useEffect } from "react";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./MisListas.css";

function MisListas() {
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nombreNuevaLista, setNombreNuevaLista] = useState("");

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const response = await clienteService.obtenerMisListas();
      setListas(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar listas:", error);
    } finally {
      setLoading(false);
    }
  };

  const crearLista = async () => {
    if (!nombreNuevaLista.trim()) return;

    try {
      await clienteService.crearLista({
        nombre_lista: nombreNuevaLista,
        descripcion: "",
      });
      setNombreNuevaLista("");
      setShowModal(false);
      cargarListas();
    } catch (error) {
      console.error("Error al crear lista:", error);
    }
  };

  const getEstadoBadge = (estado) => {
    if (estado === "completo") {
      return { class: "badge-success", text: "Evento completo" };
    }
    return { class: "badge-warning", text: "Evento pendiente" };
  };

  return (
    <ClienteLayout>
      <div className="listas-container">
        <div className="listas-header">
          <h1>Mis listas</h1>
          <div className="header-buttons">
            <button className="btn-outline" onClick={() => setShowModal(true)}>
              + Crear Evento
            </button>
            <button className="btn-outline">Ver todos mis eventos</button>
          </div>
        </div>

        {loading ? (
          <p>Cargando listas...</p>
        ) : listas.length === 0 ? (
          <div className="empty-state">
            <p>No tienes listas creadas aún.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Crear mi primera lista
            </button>
          </div>
        ) : (
          <div className="listas-grid">
            {listas.map((lista) => {
              const estado =
                lista.proveedores_adquiridos === lista.total_proveedores &&
                lista.total_proveedores > 0
                  ? "completo"
                  : "pendiente";
              const badge = getEstadoBadge(estado);

              return (
                <div key={lista.id_lista} className="lista-card">
                  <div className="lista-header">
                    <h3>{lista.nombre_lista}</h3>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </div>
                  <button className="btn-detalles">Visualizar detalles</button>
                  <div className="lista-stats">
                    <span>{lista.total_proveedores} proveedores</span>
                    <span>{lista.proveedores_adquiridos} adquiridos</span>
                  </div>
                </div>
              );
            })}

            {/* Lista de Proveedores Guardados */}
            <div className="lista-card lista-especial">
              <div className="lista-header">
                <h3>Proveedores guardados</h3>
              </div>
              <button className="btn-detalles">Visualizar todos</button>
            </div>
          </div>
        )}

        {/* Modal para crear lista */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Crear nuevo evento</h2>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre del evento"
                value={nombreNuevaLista}
                onChange={(e) => setNombreNuevaLista(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  className="btn-cancelar"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button className="btn-crear" onClick={crearLista}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default MisListas;
