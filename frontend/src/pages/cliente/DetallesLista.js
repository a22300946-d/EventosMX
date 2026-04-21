import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./DetallesLista.css";

function DetallesLista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lista, setLista] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarDetalles();
  }, [id]);

  const cargarDetalles = async () => {
    try {
      setLoading(true);
      const response = await clienteService.obtenerListaPorId(id);
      
      setLista(response.data.data.lista);
      setProveedores(response.data.data.proveedores || []);
    } catch (error) {
      console.error("Error al cargar detalles:", error);
      if (error.response?.status === 404) {
        navigate("/cliente/listas");
      }
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (idListaProveedor, nuevoEstado) => {
    try {
      setActualizando(true);

      await clienteService.cambiarEstadoProveedor(idListaProveedor, nuevoEstado);

      // Actualizar localmente
      setProveedores(proveedores.map(p =>
        p.id_lista_proveedor === idListaProveedor
          ? { ...p, estado: nuevoEstado }
          : p
      ));

      // Recargar para actualizar estadísticas
      await cargarDetalles();
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert("Error al actualizar el estado");
    } finally {
      setActualizando(false);
    }
  };

  const eliminarProveedor = async (idListaProveedor, nombreProveedor) => {
    if (!window.confirm(`¿Eliminar "${nombreProveedor}" de esta lista?`)) {
      return;
    }

    try {
      setActualizando(true);

      await clienteService.eliminarProveedorDeLista(idListaProveedor);

      // Actualizar localmente
      setProveedores(proveedores.filter(p => p.id_lista_proveedor !== idListaProveedor));

      // Recargar para actualizar estadísticas
      await cargarDetalles();
    } catch (error) {
      console.error("Error al eliminar proveedor:", error);
      alert("Error al eliminar el proveedor");
    } finally {
      setActualizando(false);
    }
  };

  const verPerfilProveedor = (idProveedor) => {
    navigate(`/perfil-proveedor/${idProveedor}`);
  };

  if (loading) {
    return (
      <ClienteLayout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando evento...</p>
        </div>
      </ClienteLayout>
    );
  }

  if (!lista) {
    return (
      <ClienteLayout>
        <div className="error-container">
          <h2>Evento no encontrado</h2>
          <button onClick={() => navigate("/cliente/listas")} className="btn-volver">
            Volver a mis eventos
          </button>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="detalles-lista-container">
        <button className="btn-volver-simple" onClick={() => navigate("/cliente/listas")}>
          ← Volver a mis eventos
        </button>

        <div className="lista-header-section">
          <div className="lista-info">
            <h1>{lista.nombre_lista}</h1>
            {lista.descripcion && <p className="lista-desc">{lista.descripcion}</p>}
          </div>
          
          <div className="lista-resumen">
            <div className="resumen-item">
              <span className="resumen-numero">{proveedores.length}</span>
              <span className="resumen-label">Total</span>
            </div>
            <div className="resumen-item success">
              <span className="resumen-numero">
                {proveedores.filter(p => p.estado === 'Adquirido').length}
              </span>
              <span className="resumen-label">Adquiridos</span>
            </div>
            <div className="resumen-item warning">
              <span className="resumen-numero">
                {proveedores.filter(p => p.estado === 'Pendiente').length}
              </span>
              <span className="resumen-label">Pendientes</span>
            </div>
          </div>
        </div>

        {proveedores.length === 0 ? (
          <div className="empty-proveedores">
            <div className="empty-icon">📭</div>
            <h3>No hay proveedores en este evento</h3>
            <p>Explora proveedores y agrégalos a esta lista</p>
            <button
              className="btn-explorar"
              onClick={() => navigate("/cliente/explorar")}
            >
              Explorar proveedores
            </button>
          </div>
        ) : (
          <div className="proveedores-lista">
            {proveedores.map((proveedor) => (
              <div key={proveedor.id_lista_proveedor} className="proveedor-item">
                <div className="proveedor-imagen">
                  <img
                    src={proveedor.logo || "https://via.placeholder.com/100"}
                    alt={proveedor.nombre_negocio}
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/100?text=Sin+Logo";
                    }}
                  />
                </div>

                <div className="proveedor-info">
                  <h3>{proveedor.nombre_negocio}</h3>
                  <p className="proveedor-tipo">{proveedor.tipo_servicio}</p>
                  <p className="proveedor-ciudad">📍 {proveedor.ciudad}</p>
                </div>

                <div className="proveedor-acciones">
                  <select
                    className={`estado-select estado-${proveedor.estado.toLowerCase()}`}
                    value={proveedor.estado}
                    onChange={(e) => cambiarEstado(proveedor.id_lista_proveedor, e.target.value)}
                    disabled={actualizando}
                  >
                    <option value="Pendiente">⏳ Pendiente</option>
                    <option value="Adquirido">✓ Adquirido</option>
                  </select>

                  <button
                    className="btn-ver-perfil"
                    onClick={() => verPerfilProveedor(proveedor.id_proveedor)}
                  >
                    Ver perfil
                  </button>

                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarProveedor(proveedor.id_lista_proveedor, proveedor.nombre_negocio)}
                    disabled={actualizando}
                    title="Eliminar de la lista"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default DetallesLista;