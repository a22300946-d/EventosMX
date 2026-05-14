import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import './SolicitudesProveedores.css';

function SolicitudesProveedores() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal de confirmación
  const [modal, setModal] = useState({
    visible: false,
    titulo: '',
    descripcion: '',
    textoConfirmar: '',
    tipo: '',   // 'aceptar' | 'rechazar'
    onConfirmar: null,
  });

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/admin/solicitudes-proveedores');
      setSolicitudes(res.data.data);
    } catch (err) {
      setError('No se pudieron cargar las solicitudes.');
    } finally {
      setCargando(false);
    }
  };

  const pedirResolver = (proveedor, decision) => {
    const esAceptar = decision === 'aprobado';
    setModal({
      visible: true,
      titulo: esAceptar ? '¿Aprobar proveedor?' : '¿Rechazar proveedor?',
      descripcion: esAceptar
        ? `Vas a aprobar la solicitud de "${proveedor.nombre_negocio}". El proveedor podrá acceder a la plataforma.`
        : `Vas a rechazar la solicitud de "${proveedor.nombre_negocio}". Esta acción no se puede deshacer.`,
      textoConfirmar: esAceptar ? 'Sí, aprobar' : 'Sí, rechazar',
      tipo: esAceptar ? 'aceptar' : 'rechazar',
      onConfirmar: () => resolver(proveedor.id_proveedor, decision),
    });
  };

  const resolver = async (id, decision) => {
    try {
      await api.patch(`/admin/solicitudes-proveedores/${id}/decision`, { decision });
      const accion = decision === 'aprobado' ? 'aprobado' : 'rechazado';
      setMensaje(`Proveedor ${accion} correctamente.`);
      await cargarSolicitudes();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      setError('Error al procesar la solicitud.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const cerrarModal = () => {
    setModal({ visible: false, titulo: '', descripcion: '', textoConfirmar: '', tipo: '', onConfirmar: null });
  };

  const confirmarModal = async () => {
    if (modal.onConfirmar) await modal.onConfirmar();
    cerrarModal();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="sp-container">
        <h1 className="sp-titulo">Solicitudes de proveedores</h1>

        {mensaje && <div className="sp-mensaje-exito">{mensaje}</div>}
        {error   && <div className="sp-mensaje-error">{error}</div>}

        {cargando ? (
          <p className="sp-cargando">Cargando solicitudes...</p>
        ) : solicitudes.length === 0 ? (
          <div className="sp-vacio">
            <p>No hay solicitudes pendientes.</p>
          </div>
        ) : (
          <div className="sp-lista">
            {solicitudes.map(p => (
              <div key={p.id_proveedor} className="sp-card">
                <div className="sp-card-header">
                  <h2 className="sp-nombre">{p.nombre_negocio}</h2>
                  <span className="sp-tipo">{p.tipo_servicio}</span>
                </div>

                <div className="sp-card-body">
                  <div className="sp-info-col">
                    <div className="sp-info-fila">
                      <span className="sp-label">Responsable:</span>
                      <span>{p.nombre_negocio}</span>
                    </div>
                    <div className="sp-info-fila">
                      <span className="sp-label">Correo:</span>
                      <span>{p.correo}</span>
                    </div>
                    <div className="sp-info-fila">
                      <span className="sp-label">Teléfono:</span>
                      <span>{p.telefono || '—'}</span>
                    </div>
                    <div className="sp-info-fila">
                      <span className="sp-label">Ciudad:</span>
                      <span>{p.ciudad || '—'}</span>
                    </div>
                    <div className="sp-info-fila">
                      <span className="sp-label">Fecha de registro:</span>
                      <span>{formatearFecha(p.fecha_registro)}</span>
                    </div>
                  </div>

                  <div className="sp-descripcion-col">
                    <span className="sp-label">Descripción:</span>
                    <p className="sp-descripcion">{p.descripcion || 'Sin descripción.'}</p>
                  </div>
                </div>

                <div className="sp-card-acciones">
                  <button
                    className="sp-btn sp-btn-aceptar"
                    onClick={() => pedirResolver(p, 'aprobado')}
                  >
                    Aceptar
                  </button>
                  <button
                    className="sp-btn sp-btn-rechazar"
                    onClick={() => pedirResolver(p, 'rechazado')}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación */}
      {modal.visible && (
        <div className="sp-modal-overlay" onClick={cerrarModal}>
          <div className="sp-modal" onClick={e => e.stopPropagation()}>
            <div className="sp-modal-icono">
              {modal.tipo === 'aceptar' ? '✅' : '❌'}
            </div>
            <h3 className="sp-modal-titulo">{modal.titulo}</h3>
            <p className="sp-modal-desc">{modal.descripcion}</p>
            <div className="sp-modal-acciones">
              <button className="sp-modal-btn-cancelar" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className={`sp-modal-btn-confirmar sp-modal-btn-${modal.tipo}`}
                onClick={confirmarModal}
              >
                {modal.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default SolicitudesProveedores;
