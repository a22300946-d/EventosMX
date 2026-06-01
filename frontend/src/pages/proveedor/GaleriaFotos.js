import React, { useState, useEffect, useRef } from 'react';
import ProveedorLayout from '../../components/proveedor/ProveedorLayout';
import { proveedorService } from '../../services/proveedorService';
import { ModalConfirm, useModal } from '../../components/modales';
import {
  FiCamera, FiFolder, FiFileText, FiCalendar, FiEye,
  FiTrash2, FiX, FiUploadCloud, FiCheckCircle, FiAlertTriangle,
  FiImage
} from 'react-icons/fi';
import './GaleriaFotos.css';

// ─── Toast de notificación ────────────────────────────────────────────────────
function Toast({ mensaje, tipo, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast-pro toast-pro--${tipo}`}>
      {tipo === 'exito' ? <FiCheckCircle size={18} /> : <FiAlertTriangle size={18} />}
      <span>{mensaje}</span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function GaleriaFotos() {
  const [fotos, setFotos] = useState([]);
  const [limite, setLimite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const { modalConfirm, mostrarConfirmacion, cerrarConfirm } = useModal();

  const mostrarToast = (mensaje, tipo = 'exito') => setToast({ mensaje, tipo });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
  cargarGaleria();
  cargarLimite();
  }, [cargarGaleria, cargarLimite]);

  const cargarGaleria = async () => {
    try {
      const response = await proveedorService.obtenerMiGaleria();
      setFotos(response.data.data || []);
    } catch (error) {
      mostrarToast('Error al cargar la galería', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarLimite = async () => {
    try {
      const response = await proveedorService.obtenerInfoLimiteGaleria();
      setLimite(response.data.data);
    } catch {
      // silencioso
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarToast('Solo se permiten imágenes', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      mostrarToast('La imagen no debe superar los 5MB', 'error');
      return;
    }

    setArchivoSeleccionado(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagenPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const subirFoto = async () => {
    if (!archivoSeleccionado) {
      mostrarToast('Por favor selecciona una imagen', 'error');
      return;
    }
    if (!descripcion.trim()) {
      mostrarToast('Por favor agrega una descripción', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('foto', archivoSeleccionado);
      formData.append('descripcion', descripcion.trim());
      await proveedorService.agregarFoto(formData);

      cancelarSeleccion();
      await cargarGaleria();
      await cargarLimite();
      mostrarToast('Foto agregada exitosamente');
    } catch (error) {
      mostrarToast(error.response?.data?.message || 'Error al subir la foto', 'error');
    } finally {
      setUploading(false);
    }
  };

  const pedirConfirmacion = (foto) => {
    mostrarConfirmacion({
      title: '¿Eliminar foto?',
      message: `"${foto.descripcion}"`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        cerrarConfirm();
        try {
          await proveedorService.eliminarFoto(foto.id_foto);
          await cargarGaleria();
          await cargarLimite();
          setMostrarModal(false);
          mostrarToast('Foto eliminada exitosamente');
        } catch {
          mostrarToast('Error al eliminar la foto', 'error');
        }
      },
    });
  };

  const cancelarSeleccion = () => {
    setArchivoSeleccionado(null);
    setImagenPreview(null);
    setDescripcion('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const abrirModal = (foto) => { setFotoSeleccionada(foto); setMostrarModal(true); };
  const cerrarModal = () => { setMostrarModal(false); setFotoSeleccionada(null); };

  return (
    <ProveedorLayout>
      <div className="galeria-container-pro">

        {/* Toast */}
        {toast && (
          <Toast
            mensaje={toast.mensaje}
            tipo={toast.tipo}
            onClose={() => setToast(null)}
          />
        )}

        {/* Header */}
        <div className="galeria-header-pro">
          <div className="header-content-pro">
            <div className="header-left-pro">
              <h1 className="titulo-pro">
                <FiCamera className="titulo-icon-pro" />
                Galería de Fotos
              </h1>
              <p className="subtitulo-pro">Muestra tus mejores trabajos a los clientes</p>
            </div>
            {limite && (
              <div className="limite-badge-pro">
                <div className="limite-progress-pro">
                  <div
                    className="limite-bar-pro"
                    style={{ width: `${(limite.total_fotos / limite.limite_maximo) * 100}%` }}
                  />
                </div>
                <div className="limite-text-pro">
                  <span className="limite-actual-pro">{limite.total_fotos}</span>
                  <span className="limite-separador-pro">/</span>
                  <span className="limite-max-pro">{limite.limite_maximo}</span>
                  <span className="limite-label-pro">fotos</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="loading-state-pro">
            <div className="spinner-pro"></div>
            <p>Cargando galería...</p>
          </div>
        ) : (
          <>
            {/* Formulario de subida */}
            {limite && limite.puede_agregar && (
              <div className="upload-section-pro">
                <div className="upload-card-pro">
                  {!imagenPreview ? (
                    <div
                      className="upload-dropzone-pro"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      <div className="dropzone-content-pro">
                        <div className="dropzone-icon-pro">
                          <FiUploadCloud size={64} />
                        </div>
                        <h3>Selecciona una imagen</h3>
                        <p>JPG, PNG o WEBP • Máximo 5MB</p>
                        <button className="btn-browse-pro">
                          <FiFolder size={16} />
                          Explorar archivos
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="upload-preview-section-pro">
                      <div className="preview-image-container-pro">
                        <img src={imagenPreview} alt="Preview" className="preview-image-pro" />
                        <div className="preview-overlay-pro">
                          <span className="preview-badge-pro">Vista previa</span>
                        </div>
                      </div>

                      <div className="preview-form-pro">
                        <div className="form-group-pro">
                          <label className="form-label-pro">
                            <FiFileText size={16} />
                            Descripción de la foto *
                          </label>
                          <textarea
                            className="form-textarea-pro"
                            placeholder="Describe esta foto para que los clientes sepan qué representa (ej: 'Decoración estilo rústico para boda')"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            rows="3"
                            maxLength="200"
                          />
                          <div className="caracteres-contador-pro">{descripcion.length}/200 caracteres</div>
                        </div>

                        <div className="archivo-info-pro">
                          <FiFileText size={28} className="archivo-icono-pro" />
                          <div className="archivo-detalles-pro">
                            <p className="archivo-nombre-pro">{archivoSeleccionado?.name}</p>
                            <p className="archivo-tamano-pro">
                              {(archivoSeleccionado?.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>

                        <div className="form-actions-pro">
                          <button
                            className="btn-subir-pro"
                            onClick={subirFoto}
                            disabled={uploading || !descripcion.trim()}
                          >
                            {uploading ? (
                              <>
                                <span className="spinner-small-pro"></span>
                                Subiendo...
                              </>
                            ) : (
                              <>
                                <FiCheckCircle size={18} />
                                Subir Foto
                              </>
                            )}
                          </button>
                          <button
                            className="btn-cancelar-pro"
                            onClick={cancelarSeleccion}
                            disabled={uploading}
                          >
                            <FiX size={18} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid de fotos */}
            {fotos.length > 0 ? (
              <div className="fotos-grid-pro">
                {fotos.map((foto) => (
                  <div
                    key={foto.id_foto}
                    className="foto-item-pro"
                    onClick={() => abrirModal(foto)}
                  >
                    <div className="foto-image-wrapper-pro">
                      <img
                        src={foto.url_foto}
                        alt={foto.descripcion || 'Foto de galería'}
                        className="foto-img-pro"
                      />
                      <div className="foto-hover-overlay-pro">
                        <button
                          className="btn-ver-detalle-pro"
                          onClick={(e) => { e.stopPropagation(); abrirModal(foto); }}
                        >
                          <FiEye size={16} />
                          Ver detalles
                        </button>
                      </div>
                    </div>
                    <div className="foto-info-pro">
                      <p className="foto-descripcion-pro">{foto.descripcion}</p>
                      <div className="foto-meta-pro">
                        <span className="foto-fecha-pro">
                          <FiCalendar size={13} />
                          {new Date(foto.fecha_subida).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-pro">
                <div className="empty-icon-pro"><FiImage size={80} /></div>
                <h3>Aún no tienes fotos</h3>
                <p>Agrega tu primera foto para mostrar tu trabajo</p>
              </div>
            )}

            {/* Límite alcanzado */}
            {limite && !limite.puede_agregar && (
              <div className="limite-alcanzado-pro">
                <FiAlertTriangle size={28} className="limite-alert-icon-pro" />
                <div className="limite-alert-content-pro">
                  <h4>Límite alcanzado</h4>
                  <p>
                    Has alcanzado el máximo de <strong>{limite.limite_maximo} fotos</strong>.
                    Elimina algunas para poder agregar nuevas.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de detalles */}
        {mostrarModal && fotoSeleccionada && (
          <div className="modal-overlay-pro" onClick={cerrarModal}>
            <div className="modal-content-pro" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-pro" onClick={cerrarModal}>
                <FiX size={22} />
              </button>

              <div className="modal-body-pro">
                <div className="modal-image-section-pro">
                  <img
                    src={fotoSeleccionada.url_foto}
                    alt={fotoSeleccionada.descripcion}
                    className="modal-image-pro"
                  />
                </div>

                <div className="modal-info-section-pro">
                  <h2 className="modal-title-pro">Detalles de la foto</h2>

                  <div className="modal-field-pro">
                    <label className="modal-label-pro">
                      <FiFileText size={15} /> Descripción
                    </label>
                    <p className="modal-text-pro">{fotoSeleccionada.descripcion}</p>
                  </div>

                  <div className="modal-field-pro">
                    <label className="modal-label-pro">
                      <FiCalendar size={15} /> Fecha de subida
                    </label>
                    <p className="modal-text-pro">
                      {new Date(fotoSeleccionada.fecha_subida).toLocaleDateString('es-MX', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="modal-actions-pro">
                    <button
                      className="btn-eliminar-modal-pro"
                      onClick={() => pedirConfirmacion(fotoSeleccionada)}
                    >
                      <FiTrash2 size={18} />
                      Eliminar foto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <ModalConfirm
          config={modalConfirm}
          onConfirm={modalConfirm?.onConfirm}
          onCancel={cerrarConfirm}
        />
      </div>
    </ProveedorLayout>
  );
}

export default GaleriaFotos;