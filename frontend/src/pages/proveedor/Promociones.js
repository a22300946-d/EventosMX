import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import "./Promociones.css";

function Promociones() {
  const [promociones, setPromociones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    precio_original: "",
    precio_promocional: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  // Modal de confirmación para eliminar
  const [modalConfirm, setModalConfirm] = useState({
    visible: false,
    promo: null,
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      titulo: "",
      descripcion: "",
      precio_original: "",
      precio_promocional: "",
      fecha_inicio: "",
      fecha_fin: "",
    });
    setShowModal(true);
  };

  const abrirModalEditar = (promo) => {
    setIsEditing(true);
    setEditingId(promo.id_promocion);
    
    // Formatear las fechas a YYYY-MM-DD para que el input type="date" las cargue bien
    const formatearFecha = (fechaStr) => {
      if (!fechaStr) return "";
      const d = new Date(fechaStr);
      const mes = `${d.getMonth() + 1}`.padStart(2, '0');
      const dia = `${d.getDate()}`.padStart(2, '0');
      const anio = d.getFullYear();
      return [anio, mes, dia].join('-');
    };

    setFormData({
      titulo: promo.titulo || "",
      descripcion: promo.descripcion || "",
      precio_original: promo.precio_original || "",
      precio_promocional: promo.precio_promocional || "",
      fecha_inicio: formatearFecha(promo.fecha_inicio),
      fecha_fin: formatearFecha(promo.fecha_fin),
    });
    setShowModal(true);
  };

  const guardarPromocion = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Suponiendo que el backend usa este método en tu proveedorService
        await proveedorService.actualizarPromocion(editingId, formData);
      } else {
        await proveedorService.crearPromocion(formData);
      }
      
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
      alert(error.response?.data?.message || `Error al ${isEditing ? "actualizar" : "crear"} promoción`);
    }
  };

  // Pide confirmación antes de eliminar
  const pedirEliminar = (promo) => {
    setModalConfirm({ visible: true, promo });
  };

  const confirmarEliminar = async () => {
    if (!modalConfirm.promo) return;
    try {
      await proveedorService.eliminarPromocion(modalConfirm.promo.id_promocion);
      cargarPromociones();
    } catch (error) {
      alert("Error al eliminar promoción");
    } finally {
      setModalConfirm({ visible: false, promo: null });
    }
  };

  const cerrarConfirm = () => {
    setModalConfirm({ visible: false, promo: null });
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
                  <div className="promocion-info">
                    <h3>{promo.titulo}</h3>
                    {promo.descripcion && (
                      <p className="promocion-descripcion">{promo.descripcion}</p>
                    )}
                    <div className="promocion-precios">
                      <span className="promocion-precio-original">${parseFloat(promo.precio_original).toLocaleString()}</span>
                      <span className="promocion-precio-promo">${parseFloat(promo.precio_promocional).toLocaleString()}</span>
                    </div>
                    <div className="promocion-fechas">
                      <span>Del {new Date(promo.fecha_inicio).toLocaleDateString('es-MX')} al {new Date(promo.fecha_fin).toLocaleDateString('es-MX')}</span>
                    </div>
                    <button 
                      className="btn-editar-promo"
                      onClick={() => abrirModalEditar(promo)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-eliminar-promo"
                      onClick={() => pedirEliminar(promo)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              <div
                className="promocion-placeholder"
                onClick={abrirModalCrear}
              >
                <p>Haz clic para agregar nueva promoción</p>
              </div>
            </>
          )}
        </div>

        {/* Modal Único (Nueva / Editar) */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{isEditing ? "Editar Promoción" : "Nueva Promoción"}</h2>
              <form onSubmit={guardarPromocion}>
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
                  placeholder="Precio original"
                  value={formData.precio_original}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <input
                  type="number"
                  name="precio_promocional"
                  placeholder="Precio promocional"
                  value={formData.precio_promocional}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <label className="promo-fecha-label">
                  Fecha de inicio
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
                <label className="promo-fecha-label">
                  Fecha de fin
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </label>
                <div className="modal-buttons">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancelar"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-crear">
                    {isEditing ? "Guardar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal confirmación eliminar */}
        {modalConfirm.visible && (
          <div className="promo-confirm-overlay" onClick={cerrarConfirm}>
            <div className="promo-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <div className="promo-confirm-icono">🗑️</div>
              <h3 className="promo-confirm-titulo">¿Eliminar promoción?</h3>
              <p className="promo-confirm-desc">
                Vas a eliminar la promoción <strong>"{modalConfirm.promo?.titulo}"</strong>. Esta acción no se puede deshacer.
              </p>
              <div className="promo-confirm-acciones">
                <button className="promo-confirm-btn-cancelar" onClick={cerrarConfirm}>
                  Cancelar
                </button>
                <button className="promo-confirm-btn-eliminar" onClick={confirmarEliminar}>
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProveedorLayout>
  );
}

export default Promociones;