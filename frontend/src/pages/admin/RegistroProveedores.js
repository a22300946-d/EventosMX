import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { ModalConfirm, useModal } from '../../components/modales';
import './RegistroProveedores.css';

function RegistroProveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { modalConfirm, mostrarConfirmacion, cerrarConfirm } = useModal();

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/admin/proveedores');
      setProveedores(res.data.data);
    } catch (err) {
      setError('No se pudieron cargar los proveedores.');
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000); };
  const mostrarError  = (msg) => { setError(msg);   setTimeout(() => setError(''),   3000); };

  const pedirToggleEstado = () => {
    if (!seleccionado) return;
    const proveedor = proveedores.find(p => p.id_proveedor === seleccionado);
    const bloqueado = proveedor.estado_cuenta === 'bloqueado';

    mostrarConfirmacion({
      title: bloqueado ? '¿Desbloquear proveedor?' : '¿Bloquear proveedor?',
      message: bloqueado
        ? `Vas a desbloquear la cuenta de "${proveedor.nombre_negocio}". El proveedor podrá iniciar sesión nuevamente.`
        : `Vas a bloquear la cuenta de "${proveedor.nombre_negocio}". No podrá iniciar sesión hasta que sea desbloqueado.`,
      confirmLabel: bloqueado ? 'Sí, desbloquear' : 'Sí, bloquear',
      onConfirm: async () => {
        cerrarConfirm();
        const nuevoEstado = bloqueado ? 'activo' : 'bloqueado';
        try {
          await api.patch(`/admin/proveedores/${proveedor.id_proveedor}/estado`, { estado: nuevoEstado });
          mostrarExito(`Proveedor ${nuevoEstado === 'bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente.`);
          setSeleccionado(null);
          await cargarProveedores();
        } catch (err) {
          mostrarError('Error al cambiar el estado del proveedor.');
        }
      },
    });
  };

  const proveedorSeleccionado = proveedores.find(p => p.id_proveedor === seleccionado);
  const esBloqueado = proveedorSeleccionado?.estado_cuenta === 'bloqueado';

  const formatearCalificacion = (cal) => {
    if (cal === null || cal === undefined) return '—';
    return parseFloat(cal).toFixed(2);
  };

  return (
    <AdminLayout>
      <div className="rp-container">
        <h1 className="rp-titulo">Proveedores</h1>

        {mensaje && <div className="rp-mensaje-exito">{mensaje}</div>}
        {error   && <div className="rp-mensaje-error">{error}</div>}

        {cargando ? (
          <p className="rp-cargando">Cargando proveedores...</p>
        ) : (
          <>
            <div className="rp-tabla-wrapper">
              <table className="rp-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre del negocio</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th>Tipo de servicio</th>
                    <th>Aprobación</th>
                    <th>Estado cuenta</th>
                    <th>Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="rp-sin-datos">No hay proveedores registrados.</td>
                    </tr>
                  ) : (
                    proveedores.map(p => (
                      <tr
                        key={p.id_proveedor}
                        className={`rp-fila ${seleccionado === p.id_proveedor ? 'rp-fila-seleccionada' : ''}`}
                        onClick={() => setSeleccionado(seleccionado === p.id_proveedor ? null : p.id_proveedor)}
                      >
                        <td>{p.id_proveedor}</td>
                        <td>{p.nombre_negocio}</td>
                        <td>{p.correo}</td>
                        <td>{p.telefono || '—'}</td>
                        <td>{p.ciudad || '—'}</td>
                        <td>{p.tipo_servicio || '—'}</td>
                        <td>
                          <span className={`rp-badge rp-aprobacion-${p.estado_aprobacion}`}>
                            {p.estado_aprobacion}
                          </span>
                        </td>
                        <td>
                          <span className={`rp-badge ${p.estado_cuenta === 'activo' ? 'rp-activo' : 'rp-bloqueado'}`}>
                            {p.estado_cuenta}
                          </span>
                        </td>
                        <td>{formatearCalificacion(p.calificacion_promedio)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rp-acciones">
              {seleccionado && (
                <p className="rp-seleccionado-info">
                  Seleccionado: <strong>{proveedorSeleccionado?.nombre_negocio}</strong>
                  {' '}— Estado actual: <strong>{proveedorSeleccionado?.estado_cuenta}</strong>
                </p>
              )}
              <button
                className={`rp-btn ${esBloqueado ? 'rp-btn-desbloquear' : 'rp-btn-bloquear'}`}
                onClick={pedirToggleEstado}
                disabled={!seleccionado}
              >
                {!seleccionado
                  ? 'Selecciona un proveedor'
                  : esBloqueado
                    ? 'Desbloquear proveedor'
                    : 'Bloquear proveedor'}
              </button>
            </div>
          </>
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

export default RegistroProveedores;