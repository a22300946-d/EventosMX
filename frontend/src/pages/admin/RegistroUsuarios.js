import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { ModalConfirm, useModal } from '../../components/modales';
import './RegistroUsuarios.css';

function RegistroUsuarios() {
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { modalConfirm, mostrarConfirmacion, cerrarConfirm } = useModal();

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/admin/clientes');
      setClientes(res.data.data);
    } catch (err) {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000); };
  const mostrarError  = (msg) => { setError(msg);   setTimeout(() => setError(''),   3000); };

  const pedirToggleEstado = () => {
    if (!seleccionado) return;
    const cliente = clientes.find(c => c.id_cliente === seleccionado);
    const bloqueado = cliente.estado_cuenta === 'bloqueado';

    mostrarConfirmacion({
      title: bloqueado ? '¿Desbloquear usuario?' : '¿Bloquear usuario?',
      message: bloqueado
        ? `Vas a desbloquear la cuenta de "${cliente.nombre_completo}". El usuario podrá iniciar sesión nuevamente.`
        : `Vas a bloquear la cuenta de "${cliente.nombre_completo}". No podrá iniciar sesión hasta que sea desbloqueado.`,
      confirmLabel: bloqueado ? 'Sí, desbloquear' : 'Sí, bloquear',
      onConfirm: async () => {
        cerrarConfirm();
        const nuevoEstado = bloqueado ? 'activo' : 'bloqueado';
        try {
          await api.patch(`/admin/clientes/${cliente.id_cliente}/estado`, { estado: nuevoEstado });
          mostrarExito(`Usuario ${nuevoEstado === 'bloqueado' ? 'bloqueado' : 'desbloqueado'} correctamente.`);
          setSeleccionado(null);
          await cargarClientes();
        } catch (err) {
          mostrarError('Error al cambiar el estado del usuario.');
        }
      },
    });
  };

  const clienteSeleccionado = clientes.find(c => c.id_cliente === seleccionado);
  const esBloqueado = clienteSeleccionado?.estado_cuenta === 'bloqueado';

  const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <AdminLayout>
      <div className="ru-container">
        <h1 className="ru-titulo">Usuarios</h1>

        {mensaje && <div className="ru-mensaje-exito">{mensaje}</div>}
        {error   && <div className="ru-mensaje-error">{error}</div>}

        {cargando ? (
          <p className="ru-cargando">Cargando usuarios...</p>
        ) : (
          <>
            <div className="ru-tabla-wrapper">
              <table className="ru-tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre completo</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Ciudad</th>
                    <th>Estado</th>
                    <th>Fecha de registro</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="ru-sin-datos">No hay usuarios registrados.</td>
                    </tr>
                  ) : (
                    clientes.map(c => (
                      <tr
                        key={c.id_cliente}
                        className={`ru-fila ${seleccionado === c.id_cliente ? 'ru-fila-seleccionada' : ''}`}
                        onClick={() => setSeleccionado(seleccionado === c.id_cliente ? null : c.id_cliente)}
                      >
                        <td>{c.id_cliente}</td>
                        <td>{c.nombre_completo}</td>
                        <td>{c.correo}</td>
                        <td>{c.telefono || '—'}</td>
                        <td>{c.ciudad || '—'}</td>
                        <td>
                          <span className={`ru-estado ${c.estado_cuenta === 'activo' ? 'ru-estado-activo' : 'ru-estado-bloqueado'}`}>
                            {c.estado_cuenta}
                          </span>
                        </td>
                        <td>{formatearFecha(c.fecha_registro)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="ru-acciones">
              {seleccionado && (
                <p className="ru-seleccionado-info">
                  Seleccionado: <strong>{clienteSeleccionado?.nombre_completo}</strong>
                  {' '}— Estado actual: <strong>{clienteSeleccionado?.estado_cuenta}</strong>
                </p>
              )}
              <button
                className={`ru-btn ${esBloqueado ? 'ru-btn-desbloquear' : 'ru-btn-bloquear'}`}
                onClick={pedirToggleEstado}
                disabled={!seleccionado}
              >
                {!seleccionado
                  ? 'Selecciona un usuario'
                  : esBloqueado
                    ? 'Desbloquear usuario'
                    : 'Bloquear usuario'}
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

export default RegistroUsuarios;