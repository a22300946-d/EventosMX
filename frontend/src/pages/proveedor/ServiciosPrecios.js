import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import "./ServiciosPrecios.css";

function ServiciosPrecios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre_servicio: "",
    descripcion: "",
    precio: "",
    tipo_precio: "por evento",
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await proveedorService.obtenerMisServicios();
      setServicios(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const abrirModal = (servicio = null) => {
    if (servicio) {
      setEditando(servicio.id_servicio);
      setFormData({
        nombre_servicio: servicio.nombre_servicio,
        descripcion: servicio.descripcion || "",
        precio: servicio.precio,
        tipo_precio: servicio.tipo_precio,
      });
    } else {
      setEditando(null);
      setFormData({
        nombre_servicio: "",
        descripcion: "",
        precio: "",
        tipo_precio: "por evento",
      });
    }
    setShowModal(true);
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        await proveedorService.actualizarServicio(editando, formData);
      } else {
        await proveedorService.crearServicio({
          ...formData,
          id_categoria: 1, // Puedes agregar selector de categori­a despues
        });
      }
      setShowModal(false);
      cargarServicios();
    } catch (error) {
      alert(error.response?.data?.message || "Error al guardar servicio");
    }
  };

  const eliminarServicio = async (id) => {
    if (!window.confirm("¿Eliminar este servicio?")) return;

    try {
      await proveedorService.eliminarServicio(id);
      cargarServicios();
    } catch (error) {
      alert("Error al eliminar servicio");
    }
  };

  return (
    <ProveedorLayout>
      <div className="servicios-container">
        <h1>Mis servicios</h1>

        {loading ? (
          <p>Cargando servicios...</p>
        ) : (
          <div className="servicios-list">
            {servicios.map((servicio) => (
              <div key={servicio.id_servicio} className="servicio-card">
                <div className="servicio-header">
                  <h3>{servicio.nombre_servicio}</h3>
                  <p className="servicio-precio">
                    Precio: ${servicio.precio.toLocaleString()}
                  </p>
                </div>
                <button
                  className="btn-editar-servicio"
                  onClick={() => abrirModal(servicio)}
                >
                  Editar
                </button>
              </div>
            ))}

            <div className="servicio-placeholder" onClick={() => abrirModal()}>
              <p>Haz clic para agregar nuevo servicio</p>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editando ? "Editar Servicio" : "Nuevo Servicio"}</h2>
              <form onSubmit={guardarServicio}>
                <input
                  type="text"
                  name="nombre_servicio"
                  placeholder="Nombre del servicio"
                  value={formData.nombre_servicio}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <textarea
                  name="descripcion"
                  placeholder="Descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="form-input"
                  rows="3"
                />
                <input
                  type="number"
                  name="precio"
                  placeholder="Precio"
                  value={formData.precio}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <select
                  name="tipo_precio"
                  value={formData.tipo_precio}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="por evento">Por evento</option>
                  <option value="por hora">Por hora</option>
                  <option value="por persona">Por persona</option>
                  <option value="paquete">Paquete</option>
                </select>
                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-crear">
                    {editando ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProveedorLayout>
  );
}

export default ServiciosPrecios;
