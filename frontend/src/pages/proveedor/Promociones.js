import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import "./Promociones.css";

function Promociones() {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    precio_original: "",
    precio_promocional: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    try {
      const response = await proveedorService.obtenerMisPromociones();
      setPromociones(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar promociones:", error);
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

  const crearPromocion = async (e) => {
    e.preventDefault();
    try {
      await proveedorService.crearPromocion(formData);
      setShowModal(false);
      setFormData({
        titulo: "",
        descripcion: "",
        precio_original: "",
        precio_promocional: "",
        fecha_inicio: "",
        fecha_fin: "",
      });
      cargarPromociones();
    } catch (error) {
      alert(error.response?.data?.message || "Error al crear promoción");
    }
  };

  const eliminarPromocion = async (id) => {
    if (!window.confirm("¿Eliminar esta promoción?")) return;

    try {
      await proveedorService.eliminarPromocion(id);
      cargarPromociones();
    } catch (error) {
      alert("Error al eliminar promoción");
    }
  };

  return (
    <ProveedorLayout>
      <div className="promociones-container">
        <h1>Mis promociones</h1>

        <div className="promociones-grid">
          {loading ? (
            <p>Cargando promociones...</p>
          ) : (
            <>
              {promociones.map((promo) => (
                <div key={promo.id_promocion} className="promocion-card">
                  <div className="promocion-imagen">
                    <img
                      src="https://via.placeholder.com/300x200"
                      alt={promo.titulo}
                    />
                  </div>
                  <div className="promocion-info">
                    <h3>{promo.titulo}</h3>
                    <p className="promocion-detalles">*Detalles*</p>
                    <button className="btn-editar-promo">Editar</button>
                    <button
                      className="btn-eliminar-promo"
                      onClick={() => eliminarPromocion(promo.id_promocion)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              <div
                className="promocion-placeholder"
                onClick={() => setShowModal(true)}
              >
                <p>Haz clic para agregar nueva promoción</p>
              </div>
            </>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Nueva Promoción</h2>
              <form onSubmit={crearPromocion}>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Título"
                  value={formData.titulo}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <textarea
                  name="descripcion"
                  placeholder="Descripción"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="form-input"
                />
                <input
                  type="number"
                  name="precio_original"
                  placeholder="Precio Original"
                  value={formData.precio_original}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <input
                  type="number"
                  name="precio_promocional"
                  placeholder="Precio Promocional"
                  value={formData.precio_promocional}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formData.fecha_inicio}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <input
                  type="date"
                  name="fecha_fin"
                  value={formData.fecha_fin}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-crear">
                    Crear
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

export default Promociones;
