import React, { useState } from 'react';
import './ModalResena.css';
import { FiX, FiAlertCircle, FiInfo, FiSend } from 'react-icons/fi';
import { MdRateReview } from 'react-icons/md';

const ModalResena = ({ 
  isOpen, 
  onClose, 
  solicitud, 
  onEnviar 
}) => {
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comentario.trim()) {
      setError('Por favor escribe tu reseña');
      return;
    }

    if (comentario.length < 10) {
      setError('La reseña debe tener al menos 10 caracteres');
      return;
    }

    if (comentario.length > 1000) {
      setError('La reseña no puede exceder 1000 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onEnviar({
        id_proveedor: solicitud.id_proveedor,
        id_solicitud: solicitud.id_solicitud,
        comentario: comentario.trim()
      });

      setComentario('');
      onClose();
    } catch (err) {
      console.error('Error al enviar reseña:', err);
      setError(err.response?.data?.message || 'Error al enviar la reseña');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setComentario('');
      setError('');
      onClose();
    }
  };

  if (!isOpen || !solicitud) return null;

  return (
    <div className="modal-overlay-resena" onClick={handleClose}>
      <div className="modal-content-resena" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-resena">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdRateReview size={22} />
            Dejar Reseña
          </h2>
          <button 
            className="modal-close-resena" 
            onClick={handleClose}
            disabled={loading}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="modal-body-resena">
          <div className="proveedor-info-resena">
            <div className="proveedor-avatar-resena">
              {solicitud.nombre_proveedor?.charAt(0) || 'P'}
            </div>
            <div>
              <h3>{solicitud.nombre_proveedor}</h3>
              <p className="evento-info-resena">
                {solicitud.tipo_evento} - {new Date(solicitud.fecha_evento).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          <div className="info-sentimiento">
            <p style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <FiInfo size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <span>
                <strong>Nota:</strong> Tu reseña será analizada automáticamente para determinar
                su calificación basándose en el sentimiento expresado.
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group-resena">
              <label htmlFor="comentario">
                ¿Cómo fue tu experiencia? *
              </label>
              <textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Cuéntanos sobre el servicio recibido, la calidad, puntualidad, profesionalismo..."
                rows="6"
                maxLength="1000"
                disabled={loading}
                required
              />
              <div className="character-count">
                {comentario.length} / 1000 caracteres
              </div>
            </div>

            {error && (
              <div className="error-message-resena" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiAlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="form-actions-resena">
              <button
                type="button"
                className="btn-cancelar-resena"
                onClick={handleClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-enviar-resena"
                disabled={loading || !comentario.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FiSend size={16} />
                {loading ? 'Enviando...' : 'Publicar Reseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalResena;