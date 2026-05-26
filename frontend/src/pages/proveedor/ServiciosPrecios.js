import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { ModalConfirm, ModalAlert, useModal } from "../../components/modales";
import "./ServiciosPrecios.css";

const TIPO_PRECIO_LABELS = {
  "por evento": "Por evento",
  "por hora": "Por hora",
  "por persona": "Por persona",
  "paquete": "Paquete",
};

const TIPO_PRECIO_ICONS = {
  "por evento": "📅",
  "por hora": "⏱",
  "por persona": "👤",
  "paquete": "📦",
};

function ServiciosPrecios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    nombre_servicio: "",
    descripcion: "",
    precio: "",
    tipo_precio: "por evento",
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
      setFormData({ nombre_servicio: "", descripcion: "", precio: "", tipo_precio: "por evento" });
    }
    setShowModal(true);
  };

  const cerrarModal = () => {
    if (!guardando) setShowModal(false);
  };

  const guardarServicio = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await proveedorService.actualizarServicio(editando, formData);
      } else {
        await proveedorService.crearServicio({ ...formData, id_categoria: 1 });
      }
      setShowModal(false);
      cargarServicios();
    } catch (error) {
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.message || "Error al guardar servicio",
        "error"
      );
    } finally {
      setGuardando(false);
    }
  };

  const pedirEliminar = (servicio) => {
    mostrarConfirmacion({
      title: "¿Eliminar servicio?",
      message: `Estás a punto de eliminar "${servicio.nombre_servicio}". Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      onConfirm: async () => {
        cerrarConfirm();
        const id = servicio.id_servicio;
        setEliminando(id);
        try {
          await proveedorService.eliminarServicio(id);
          setServicios((prev) => prev.filter((s) => s.id_servicio !== id));
        } catch (error) {
          mostrarAlerta("Error", "Error al eliminar servicio", "error");
        } finally {
          setEliminando(null);
        }
      },
    });
  };

  return (
    <ProveedorLayout>
      <div className="sp-container">
        {/* Header */}
        <div className="sp-header">
          <div className="sp-header-text">
            <h1>Mis servicios</h1>
            <p className="sp-subtitle">
              {servicios.length === 0
                ? "Agrega tu primer servicio para comenzar"
                : `${servicios.length} servicio${servicios.length !== 1 ? "s" : ""} publicado${servicios.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button className="sp-btn-nuevo" onClick={() => abrirModal()}>
            <span className="sp-btn-icon">+</span>
            Nuevo servicio
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="sp-loading">
            <div className="sp-spinner" />
            <p>Cargando servicios...</p>
          </div>
        ) : servicios.length === 0 ? (
          <div className="sp-empty" onClick={() => abrirModal()}>
            <div className="sp-empty-icon">🛎</div>
            <h3>Aún no tienes servicios</h3>
            <p>Haz clic aquí para agregar tu primer servicio</p>
          </div>
        ) : (
          <div className="sp-grid">
            {servicios.map((servicio) => (
              <div
                key={servicio.id_servicio}
                className={`sp-card ${eliminando === servicio.id_servicio ? "sp-card--eliminando" : ""}`}
              >
                <div className="sp-badge">
                  <span className="sp-badge-icon">{TIPO_PRECIO_ICONS[servicio.tipo_precio] || "📋"}</span>
                  {TIPO_PRECIO_LABELS[servicio.tipo_precio] || servicio.tipo_precio}
                </div>

                <h3 className="sp-card-nombre">{servicio.nombre_servicio}</h3>

                {servicio.descripcion && (
                  <p className="sp-card-descripcion">{servicio.descripcion}</p>
                )}

                <div className="sp-card-precio">
                  <span className="sp-precio-label">Precio</span>
                  <span className="sp-precio-valor">
                    ${Number(servicio.precio).toLocaleString("es-MX")}
                    <span className="sp-precio-tipo"> / {TIPO_PRECIO_LABELS[servicio.tipo_precio] || servicio.tipo_precio}</span>
                  </span>
                </div>

                <div className="sp-card-actions">
                  <button
                    className="sp-btn-editar"
                    onClick={() => abrirModal(servicio)}
                    disabled={eliminando === servicio.id_servicio}
                  >
                    ✏ Editar
                  </button>
                  <button
                    className="sp-btn-eliminar"
                    onClick={() => pedirEliminar(servicio)}
                    disabled={eliminando === servicio.id_servicio}
                  >
                    {eliminando === servicio.id_servicio ? "Eliminando..." : "🗑 Eliminar"}
                  </button>
                </div>
              </div>
            ))}

            <div className="sp-card-add" onClick={() => abrirModal()}>
              <div className="sp-card-add-inner">
                <span className="sp-card-add-icon">+</span>
                <p>Agregar servicio</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal editar/crear */}
        {showModal && (
          <div className="sp-modal-overlay" onClick={cerrarModal}>
            <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sp-modal-header">
                <h2>{editando ? "Editar servicio" : "Nuevo servicio"}</h2>
                <button className="sp-modal-close" onClick={cerrarModal} disabled={guardando}>
                  ✕
                </button>
              </div>

              <form onSubmit={guardarServicio} className="sp-form">
                <div className="sp-form-group">
                  <label className="sp-label">Nombre del servicio *</label>
                  <input
                    type="text"
                    name="nombre_servicio"
                    placeholder="Ej. Fotografía de bodas premium"
                    value={formData.nombre_servicio}
                    onChange={handleChange}
                    required
                    className="sp-input"
                  />
                </div>

                <div className="sp-form-group">
                  <label className="sp-label">Descripción</label>
                  <textarea
                    name="descripcion"
                    placeholder="Describe qué incluye el servicio, horarios, condiciones..."
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="sp-input sp-textarea"
                    rows="4"
                  />
                </div>

                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label className="sp-label">Precio (MXN) *</label>
                    <div className="sp-input-prefix-wrap">
                      <span className="sp-input-prefix">$</span>
                      <input
                        type="number"
                        name="precio"
                        placeholder="0.00"
                        value={formData.precio}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="sp-input sp-input-prefixed"
                      />
                    </div>
                  </div>

                  <div className="sp-form-group">
                    <label className="sp-label">Tipo de precio *</label>
                    <select
                      name="tipo_precio"
                      value={formData.tipo_precio}
                      onChange={handleChange}
                      className="sp-input sp-select"
                    >
                      <option value="por evento">Por evento</option>
                      <option value="por hora">Por hora</option>
                      <option value="por persona">Por persona</option>
                      <option value="paquete">Paquete</option>
                    </select>
                  </div>
                </div>

                <div className="sp-modal-footer">
                  <button
                    type="button"
                    className="sp-btn-cancel"
                    onClick={cerrarModal}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="sp-btn-save" disabled={guardando}>
                    {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear servicio"}
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

export default ServiciosPrecios;