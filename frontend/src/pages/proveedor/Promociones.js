import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { ModalConfirm, ModalAlert, useModal } from "../../components/modales";
import "./Promociones.css";

/* ─── Valor inicial del formulario ─────────────────────────────────── */
const FORM_VACIO = {
  titulo: "",
  descripcion: "",
  precio_original: "",
  precio_promocional: "",
  fecha_inicio: "",
  fecha_fin: "",
  // condiciones
  min_invitados: "",          // número mínimo de invitados (vacío = sin mínimo)
  servicios_requeridos: [],   // IDs de servicios que activan la promo
};

function Promociones() {
  const [promociones, setPromociones]   = useState([]);
  const [servicios, setServicios]       = useState([]);  // servicios del proveedor
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [isEditing, setIsEditing]       = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [formData, setFormData]         = useState(FORM_VACIO);

  const { modalConfirm, modalAlert, mostrarAlerta, mostrarConfirmacion, cerrarConfirm, cerrarAlert } = useModal();

  useEffect(() => {
    cargarPromociones();
    cargarServicios();
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

  const cargarServicios = async () => {
    try {
      const response = await proveedorService.obtenerMisServicios();
      setServicios(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /* Toggle servicio requerido en la lista de condiciones */
  const handleToggleServicio = (id_servicio) => {
    setFormData(prev => {
      const ya = prev.servicios_requeridos.includes(id_servicio);
      return {
        ...prev,
        servicios_requeridos: ya
          ? prev.servicios_requeridos.filter(id => id !== id_servicio)
          : [...prev.servicios_requeridos, id_servicio],
      };
    });
  };

  /* Serializar condiciones al objeto que espera el backend */
  const buildCondiciones = () => {
    const cond = {};
    if (formData.min_invitados && parseInt(formData.min_invitados) > 0) {
      cond.min_invitados = parseInt(formData.min_invitados);
    }
    if (formData.servicios_requeridos.length > 0) {
      cond.servicios_requeridos = formData.servicios_requeridos;
    }
    return Object.keys(cond).length > 0 ? cond : null;
  };

  const abrirModalCrear = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(FORM_VACIO);
    setShowModal(true);
  };

  const abrirModalEditar = (promo) => {
    setIsEditing(true);
    setEditingId(promo.id_promocion);

    const formatFecha = (f) => {
      if (!f) return "";
      const d = new Date(f);
      return [d.getFullYear(), `${d.getMonth()+1}`.padStart(2,"0"), `${d.getDate()}`.padStart(2,"0")].join("-");
    };

    // Parsear condiciones guardadas
    let cond = {};
    if (promo.condiciones) {
      try { cond = typeof promo.condiciones === "string" ? JSON.parse(promo.condiciones) : promo.condiciones; } catch { cond = {}; }
    }

    setFormData({
      titulo:               promo.titulo || "",
      descripcion:          promo.descripcion || "",
      precio_original:      promo.precio_original || "",
      precio_promocional:   promo.precio_promocional || "",
      fecha_inicio:         formatFecha(promo.fecha_inicio),
      fecha_fin:            formatFecha(promo.fecha_fin),
      min_invitados:        cond.min_invitados || "",
      servicios_requeridos: cond.servicios_requeridos || [],
    });
    setShowModal(true);
  };

  const guardarPromocion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        titulo:             formData.titulo,
        descripcion:        formData.descripcion,
        precio_original:    formData.precio_original,
        precio_promocional: formData.precio_promocional,
        fecha_inicio:       formData.fecha_inicio,
        fecha_fin:          formData.fecha_fin,
        condiciones:        buildCondiciones(),
      };

      if (isEditing) {
        await proveedorService.actualizarPromocion(editingId, payload);
      } else {
        await proveedorService.crearPromocion(payload);
      }

      setShowModal(false);
      setFormData(FORM_VACIO);
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
        } catch {
          mostrarAlerta("Error", "Error al eliminar promoción", "error");
        }
      },
    });
  };

  /* Texto legible de las condiciones para mostrar en la tarjeta */
  const textoCondiciones = (promo) => {
    let cond = {};
    if (promo.condiciones) {
      try { cond = typeof promo.condiciones === "string" ? JSON.parse(promo.condiciones) : promo.condiciones; } catch { cond = {}; }
    }
    const partes = [];
    if (cond.min_invitados) partes.push(`Mín. ${cond.min_invitados} invitados`);
    if (cond.servicios_requeridos?.length) {
      const nombres = cond.servicios_requeridos
        .map(id => servicios.find(s => s.id_servicio === id)?.nombre_servicio || `Servicio ${id}`)
        .join(" o ");
      partes.push(`Requiere: ${nombres}`);
    }
    return partes.length > 0 ? partes.join(" · ") : "Aplica siempre";
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
                      <span className="promocion-precio-original">
                        ${parseFloat(promo.precio_original).toLocaleString()}
                      </span>
                      <span className="promocion-precio-promo">
                        ${parseFloat(promo.precio_promocional).toLocaleString()}
                      </span>
                    </div>
                    <div className="promocion-fechas">
                      <span>
                        Del {new Date(promo.fecha_inicio).toLocaleDateString("es-MX")} al{" "}
                        {new Date(promo.fecha_fin).toLocaleDateString("es-MX")}
                      </span>
                    </div>
                    {/* Condiciones de aplicación */}
                    <div className="promocion-condiciones">
                      <span className="condiciones-label">📋 Condiciones:</span>
                      <span className="condiciones-texto">{textoCondiciones(promo)}</span>
                    </div>
                    <div className="promocion-acciones">
                      <button className="btn-editar-promo" onClick={() => abrirModalEditar(promo)}>
                        Editar
                      </button>
                      <button className="btn-eliminar-promo" onClick={() => pedirEliminar(promo)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="promocion-placeholder" onClick={abrirModalCrear}>
                <p>Haz clic para agregar nueva promoción</p>
              </div>
            </>
          )}
        </div>

        {/* ── Modal Nueva / Editar ────────────────────────────────── */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="modal-content modal-content-grande"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{isEditing ? "Editar Promoción" : "Nueva Promoción"}</h2>
              <form onSubmit={guardarPromocion}>

                {/* Datos básicos */}
                <input
                  type="text" name="titulo" placeholder="Título de la promoción"
                  value={formData.titulo} onChange={handleChange}
                  required className="form-input"
                />
                <textarea
                  name="descripcion" placeholder="Descripción (opcional)"
                  value={formData.descripcion} onChange={handleChange}
                  className="form-input"
                />
                <div className="promo-row">
                  <div className="promo-campo">
                    <label className="promo-fecha-label">Precio original</label>
                    <input
                      type="number" name="precio_original" placeholder="$0.00"
                      value={formData.precio_original} onChange={handleChange}
                      required min="0" step="0.01" className="form-input"
                    />
                  </div>
                  <div className="promo-campo">
                    <label className="promo-fecha-label">Precio promocional</label>
                    <input
                      type="number" name="precio_promocional" placeholder="$0.00"
                      value={formData.precio_promocional} onChange={handleChange}
                      required min="0" step="0.01" className="form-input"
                    />
                  </div>
                </div>
                <div className="promo-row">
                  <div className="promo-campo">
                    <label className="promo-fecha-label">Fecha de inicio</label>
                    <input
                      type="date" name="fecha_inicio"
                      value={formData.fecha_inicio} onChange={handleChange}
                      required className="form-input"
                    />
                  </div>
                  <div className="promo-campo">
                    <label className="promo-fecha-label">Fecha de fin</label>
                    <input
                      type="date" name="fecha_fin"
                      value={formData.fecha_fin} onChange={handleChange}
                      required className="form-input"
                    />
                  </div>
                </div>

                {/* ── Sección de condiciones ───────────────────────────── */}
                <div className="condiciones-seccion">
                  <h3 className="condiciones-titulo">
                    📋 Condiciones de aplicación
                    <span className="condiciones-hint">
                      (Deja vacío para que aplique siempre)
                    </span>
                  </h3>

                  {/* Mínimo de invitados */}
                  <label className="promo-fecha-label">
                    Mínimo de invitados requerido
                    <input
                      type="number" name="min_invitados"
                      placeholder="Ej: 50 (vacío = sin mínimo)"
                      value={formData.min_invitados} onChange={handleChange}
                      min="1" className="form-input"
                    />
                  </label>

                  {/* Servicios requeridos */}
                  {servicios.length > 0 && (
                    <div className="condicion-servicios">
                      <p className="condicion-label">
                        Servicios que activan esta promoción
                        <span className="condiciones-hint">
                          {" "}(el cliente debe seleccionar al menos uno)
                        </span>
                      </p>
                      <div className="servicios-condicion-lista">
                        {servicios.map(s => (
                          <label key={s.id_servicio} className="servicio-condicion-item">
                            <input
                              type="checkbox"
                              checked={formData.servicios_requeridos.includes(s.id_servicio)}
                              onChange={() => handleToggleServicio(s.id_servicio)}
                            />
                            <span>{s.nombre_servicio}</span>
                            <span className="servicio-condicion-precio">
                              ${parseFloat(s.precio || 0).toLocaleString("es-MX")}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-cancelar">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-crear">
                    {isEditing ? "Guardar cambios" : "Crear promoción"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ModalConfirm config={modalConfirm} onConfirm={modalConfirm?.onConfirm} onCancel={cerrarConfirm} />
        <ModalAlert config={modalAlert} onClose={cerrarAlert} />
      </div>
    </ProveedorLayout>
  );
}

export default Promociones;