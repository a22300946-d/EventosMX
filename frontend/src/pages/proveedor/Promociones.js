import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { ModalConfirm, ModalAlert, useModal } from "../../components/modales";
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

  const {
    modalConfirm,
    modalAlert,
    mostrarAlerta,
    mostrarConfirmacion,
    cerrarConfirm,
    cerrarAlert,
  } = useModal();

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

    const formatearFecha = (fechaStr) => {
      if (!fechaStr) return "";
      const d = new Date(fechaStr);
      const mes = `${d.getMonth() + 1}`.padStart(2, "0");
      const dia = `${d.getDate()}`.padStart(2, "0");
      const anio = d.getFullYear();
      return [anio, mes, dia].join("-");
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
      mostrarAlerta(
        "Error",
        error.response?.data?.message || `Error al ${isEditing ? "actualizar" : "crear"} promoción`,
        "error"
      );
    }
  };

  const pedirEliminar = (promo) => {
    mostrarConfirmacion({
      title: "¿Eliminar promoción?",
      message: `Vas a eliminar la promoción "${promo.titulo}". Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      onConfirm: async () => {
        cerrarConfirm();
        try {
          await proveedorService.eliminarPromocion(promo.id_promocion);
          cargarPromociones();
        } catch (error) {
          mostrarAlerta("Error", "Error al eliminar promoción", "error");
        }
      },
    });
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
                      <span>Del {new Date(promo.fecha_inicio).toLocaleDateString("es-MX")} al {new Date(promo.fecha_fin).toLocaleDateString("es-MX")}</span>
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

              <div className="promocion-placeholder" onClick={abrirModalCrear}>
                <p>Haz clic para agregar nueva promoción</p>
              </div>
            </>
          )}
        </div>

        {/* Modal Nueva / Editar */}
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

        <ModalConfirm
          config={modalConfirm}
          onConfirm={modalConfirm?.onConfirm}
          onCancel={cerrarConfirm}
        />
        <ModalAlert
          config={modalAlert}
          onClose={cerrarAlert}
        />
      </div>
    </ProveedorLayout>
  );
}

export default Promociones;