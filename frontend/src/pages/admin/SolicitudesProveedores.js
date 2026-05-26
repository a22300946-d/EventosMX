import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { ModalConfirm, useModal } from '../../components/modales';
import './SolicitudesProveedores.css';

function SolicitudesProveedores() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { modalConfirm, mostrarConfirmacion, cerrarConfirm } = useModal();

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

  const mostrarExito = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000); };
  const mostrarError  = (msg) => { setError(msg);   setTimeout(() => setError(''),   3000); };

  const pedirResolver = (proveedor, decision) => {
    const esAceptar = decision === 'aprobado';
    mostrarConfirmacion({
      title: esAceptar ? '¿Aprobar proveedor?' : '¿Rechazar proveedor?',
      message: esAceptar
        ? `Vas a aprobar la solicitud de "${proveedor.nombre_negocio}". El proveedor podrá acceder a la plataforma.`
        : `Vas a rechazar la solicitud de "${proveedor.nombre_negocio}". Esta acción no se puede deshacer.`,
      confirmLabel: esAceptar ? 'Sí, aprobar' : 'Sí, rechazar',
      onConfirm: async () => {
        cerrarConfirm();
        try {
          await api.patch(`/admin/solicitudes-proveedores/${proveedor.id_proveedor}/decision`, { decision });
          const accion = decision === 'aprobado' ? 'aprobado' : 'rechazado';
          mostrarExito(`Proveedor ${accion} correctamente.`);
          await cargarSolicitudes();
        } catch (err) {
          mostrarError('Error al procesar la solicitud.');
        }
      },
    });
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

      <ModalConfirm
        config={modalConfirm}
        onConfirm={modalConfirm?.onConfirm}
        onCancel={cerrarConfirm}
      />
    </AdminLayout>
  );
}

export default SolicitudesProveedores;