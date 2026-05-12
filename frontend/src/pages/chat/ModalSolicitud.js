import React, { useState, useEffect } from 'react';
import './ModalSolicitud.css';

const ModalSolicitud = ({ 
  isOpen, 
  onClose, 
  solicitud, 
  usuarioTipo,
  onAprobar,
  onRechazar,
  onEnviarPropuesta,
  mensajes // ← NUEVO: recibir los mensajes del chat
}) => {
  const [propuesta, setPropuesta] = useState({
    precio: '',
    descripcion: '',
    fecha_servicio: '',
    hora_servicio: '',
    notas_adicionales: ''
  });

  const [loading, setLoading] = useState(false);
  const [propuestaProveedor, setPropuestaProveedor] = useState(null);

  // Función para detectar y parsear propuestas en los mensajes
  const detectarPropuesta = () => {
    if (!mensajes || mensajes.length === 0) return null;

    // Buscar el último mensaje que contenga "**Mi Propuesta**"
    const mensajeConPropuesta = [...mensajes]
      .reverse()
      .find(m => m.contenido.includes('**Mi Propuesta**'));

    if (!mensajeConPropuesta) return null;

    // Parsear el contenido de la propuesta
    const contenido = mensajeConPropuesta.contenido;
    
    try {
      const precioMatch = contenido.match(/\*\*Precio Total:\*\*\s*\$?([\d,]+)/);
      const descripcionMatch = contenido.match(/\*\*Descripción:\*\*\s*\n([\s\S]*?)(?=\n\n|\*\*|$)/);
      // ✅ Actualizado para capturar formato largo: "lunes, 18 de mayo de 2026"
      const fechaMatch = contenido.match(/\*\*Fecha:\*\*\s*([^\n]+)/);
      const horaMatch = contenido.match(/\*\*Hora:\*\*\s*([\d:]+)/);
      const notasMatch = contenido.match(/\*\*Notas:\*\*\s*\n([\s\S]*?)(?=¿Te parece|$)/);

      return {
        precio: precioMatch ? precioMatch[1].replace(/,/g, '') : null,
        descripcion: descripcionMatch ? descripcionMatch[1].trim() : null,
        fecha_servicio: fechaMatch ? fechaMatch[1].trim() : null,
        hora_servicio: horaMatch ? horaMatch[1] : null,
        notas_adicionales: notasMatch ? notasMatch[1].trim() : null,
        mensaje_id: mensajeConPropuesta.id_mensaje,
        fecha_envio: mensajeConPropuesta.fecha_envio
      };
    } catch (error) {
      console.error('Error al parsear propuesta:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isOpen && solicitud) {
      console.log('📋 Modal actualizado - Estado actual:', solicitud.estado);
      
      // Pre-llenar fecha si existe (arreglar desfase de zona horaria)
      if (solicitud.fecha_evento) {
        // ✅ Usar la fecha SIN conversión de zona horaria
        const fechaString = solicitud.fecha_evento.split('T')[0];
        setPropuesta(prev => ({
          ...prev,
          fecha_servicio: fechaString
        }));
      }

      // Detectar si hay una propuesta del proveedor
      if (usuarioTipo === 'cliente') {
        const propuestaDetectada = detectarPropuesta();
        setPropuestaProveedor(propuestaDetectada);
        console.log('🔍 Propuesta detectada:', propuestaDetectada);
      }
    }
  }, [isOpen, solicitud, solicitud?.estado, mensajes, usuarioTipo]);

  if (!isOpen || !solicitud) return null;

  const handleAprobar = async () => {
    setLoading(true);
    try {
      await onAprobar(solicitud.id_solicitud);
      onClose();
    } catch (error) {
      console.error('Error al aprobar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = async () => {
    if (window.confirm('¿Estás seguro de rechazar esta solicitud?')) {
      setLoading(true);
      try {
        await onRechazar(solicitud.id_solicitud);
        onClose();
      } catch (error) {
        console.error('Error al rechazar:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEnviarPropuesta = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!propuesta.precio || !propuesta.descripcion) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      await onEnviarPropuesta(solicitud.id_solicitud, propuesta);
      onClose();
      // Limpiar formulario
      setPropuesta({
        precio: '',
        descripcion: '',
        fecha_servicio: '',
        hora_servicio: '',
        notas_adicionales: ''
      });
    } catch (error) {
      console.error('Error al enviar propuesta:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    
    // ✅ Extraer la fecha sin conversión de zona horaria
    const fechaString = fecha.split('T')[0]; // "2026-05-13"
    const [year, month, day] = fechaString.split('-').map(Number);
    
    // Crear fecha en hora local (sin UTC)
    const fechaLocal = new Date(year, month - 1, day);
    
    return fechaLocal.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {usuarioTipo === 'cliente' ? '📋 Detalles de la Solicitud' : '📝 Enviar Propuesta'}
          </h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* INFORMACIÓN DE LA SOLICITUD - SOLO PARA PROVEEDOR */}
          {usuarioTipo === 'proveedor' && (
            <div className="solicitud-info">
              <h3>Información del Evento</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">🎉 Tipo de evento:</span>
                  <span className="info-value">{solicitud.tipo_evento || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">📅 Fecha del evento:</span>
                  <span className="info-value">{formatearFecha(solicitud.fecha_evento)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">👥 Número de invitados:</span>
                  <span className="info-value">{solicitud.numero_invitados || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">💰 Presupuesto estimado:</span>
                  <span className="info-value">
                    {solicitud.presupuesto_estimado 
                      ? `$${parseFloat(solicitud.presupuesto_estimado).toLocaleString('es-MX')}` 
                      : 'No especificado'}
                  </span>
                </div>
                {solicitud.descripcion_solicitud && (
                  <div className="info-item info-item-full">
                    <span className="info-label">📝 Descripción:</span>
                    <p className="info-description">{solicitud.descripcion_solicitud}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA PARA CLIENTE - SOLO PROPUESTA Y ACCIONES */}
          {usuarioTipo === 'cliente' && (
            <>
              {/* ESTADO DE LA SOLICITUD */}
              <div className="estado-solicitud-header">
                <span className={`badge badge-${solicitud.estado?.toLowerCase()}`}>
                  {solicitud.estado || 'Pendiente'}
                </span>
              </div>

              {/* PROPUESTA DEL PROVEEDOR */}
              {propuestaProveedor && (
                <div className="propuesta-recibida">
                  <h3>📨 Propuesta del Proveedor</h3>
                  <div className="propuesta-content">
                    <div className="propuesta-item">
                      <span className="propuesta-label">💵 Precio Total:</span>
                      <span className="propuesta-value">
                        ${parseFloat(propuestaProveedor.precio).toLocaleString('es-MX')}
                      </span>
                    </div>

                    {propuestaProveedor.descripcion && (
                      <div className="propuesta-item propuesta-item-full">
                        <span className="propuesta-label">📝 Descripción del Servicio:</span>
                        <p className="propuesta-descripcion">{propuestaProveedor.descripcion}</p>
                      </div>
                    )}

                    {propuestaProveedor.fecha_servicio && (
                      <div className="propuesta-item">
                        <span className="propuesta-label">📅 Fecha Confirmada:</span>
                        <span className="propuesta-value">{propuestaProveedor.fecha_servicio}</span>
                      </div>
                    )}

                    {propuestaProveedor.hora_servicio && (
                      <div className="propuesta-item">
                        <span className="propuesta-label">⏰ Hora:</span>
                        <span className="propuesta-value">{propuestaProveedor.hora_servicio}</span>
                      </div>
                    )}

                    {propuestaProveedor.notas_adicionales && (
                      <div className="propuesta-item propuesta-item-full">
                        <span className="propuesta-label">📋 Notas Adicionales:</span>
                        <p className="propuesta-notas">{propuestaProveedor.notas_adicionales}</p>
                      </div>
                    )}

                    <div className="propuesta-fecha-envio">
                      Enviada el {new Date(propuestaProveedor.fecha_envio).toLocaleString('es-MX')}
                    </div>
                  </div>
                </div>
              )}

              {/* BOTONES DE ACCIÓN */}
              {propuestaProveedor && solicitud.estado !== 'Aceptada' && solicitud.estado !== 'Rechazada' && (
                <div className="action-buttons">
                  <button 
                    className="btn-aprobar"
                    onClick={handleAprobar}
                    disabled={loading}
                  >
                    ✅ Aprobar Propuesta
                  </button>
                  <button 
                    className="btn-rechazar"
                    onClick={handleRechazar}
                    disabled={loading}
                  >
                    ❌ Rechazar Propuesta
                  </button>
                </div>
              )}

              {/* MENSAJE SI NO HAY PROPUESTA */}
              {!propuestaProveedor && solicitud.estado === 'Pendiente' && (
                <div className="alert alert-info">
                  ⏳ Esperando propuesta del proveedor...
                </div>
              )}

              {/* MENSAJE SI YA FUE APROBADA */}
              {solicitud.estado === 'Aceptada' && (
                <div className="alert alert-success">
                  ✅ Ya aprobaste esta propuesta
                </div>
              )}

              {/* MENSAJE SI FUE RECHAZADA */}
              {solicitud.estado === 'Rechazada' && (
                <div className="alert alert-danger">
                  ❌ Esta propuesta fue rechazada
                </div>
              )}
            </>
          )}

          {/* VISTA PARA PROVEEDOR - ENVIAR PROPUESTA */}
          {usuarioTipo === 'proveedor' && (
            <>
              {solicitud.estado === 'Rechazada' && (
                <div className="alert alert-info" style={{marginBottom: '20px'}}>
                  ℹ️ Esta solicitud fue rechazada. Puedes enviar una nueva propuesta con mejores condiciones.
                </div>
              )}
              
              {solicitud.estado === 'Aceptada' && (
                <div className="alert alert-success" style={{marginBottom: '20px'}}>
                  ✅ Esta solicitud ya fue aceptada por el cliente.
                </div>
              )}

              {(solicitud.estado !== 'Aceptada') && (
                <form className="propuesta-form" onSubmit={handleEnviarPropuesta}>
                  <h3>{solicitud.estado === 'Rechazada' ? 'Nueva Propuesta' : 'Tu Propuesta'}</h3>

              <div className="form-group">
                <label>💵 Precio Total *</label>
                <input
                  type="number"
                  placeholder="Ejemplo: 5000"
                  value={propuesta.precio}
                  onChange={(e) => setPropuesta({...propuesta, precio: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label>📝 Descripción del Servicio *</label>
                <textarea
                  placeholder="Describe lo que incluye tu servicio..."
                  value={propuesta.descripcion}
                  onChange={(e) => setPropuesta({...propuesta, descripcion: e.target.value})}
                  required
                  rows="4"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>📅 Fecha Confirmada</label>
                  <input
                    type="date"
                    value={propuesta.fecha_servicio}
                    onChange={(e) => setPropuesta({...propuesta, fecha_servicio: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>⏰ Hora</label>
                  <input
                    type="time"
                    value={propuesta.hora_servicio}
                    onChange={(e) => setPropuesta({...propuesta, hora_servicio: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>📋 Notas Adicionales</label>
                <textarea
                  placeholder="Condiciones, políticas de cancelación, etc..."
                  value={propuesta.notas_adicionales}
                  onChange={(e) => setPropuesta({...propuesta, notas_adicionales: e.target.value})}
                  rows="3"
                />
              </div>

              <button 
                type="submit" 
                className="btn-enviar-propuesta"
                disabled={loading}
              >
                {loading ? 'Enviando...' : solicitud.estado === 'Rechazada' ? '📤 Enviar Nueva Propuesta' : '📤 Enviar Propuesta al Cliente'}
              </button>
            </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalSolicitud;