import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import './ModerarResenas.css';

function ModerarResenas() {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Modal de confirmación homogéneo
  const [modal, setModal] = useState({
    visible: false,
    icono: '',
    titulo: '',
    descripcion: '',
    textoConfirmar: '',
    tipo: '',   // 'peligro' | 'advertencia'
    onConfirmar: null,
  });

  useEffect(() => { cargarResenas(); }, []);

  const cargarResenas = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/admin/resenas');
      setResenas(res.data.data);
    } catch {
      setError('No se pudieron cargar las reseñas.');
    } finally {
      setCargando(false);
    }
  };

  const confirmar = (opciones) => setModal({ visible: true, ...opciones });
  const cerrarModal = () =>
    setModal({ visible: false, icono: '', titulo: '', descripcion: '', textoConfirmar: '', tipo: '', onConfirmar: null });

  const ejecutarConfirmacion = async () => {
    if (modal.onConfirmar) await modal.onConfirmar();
    cerrarModal();
  };

  const pedirEliminar = (resena) => confirmar({
    icono: '🗑️',
    titulo: '¿Eliminar reseña?',
    descripcion: `Vas a eliminar la reseña de "${resena.nombre_cliente}" sobre "${resena.nombre_negocio}". Esta acción ocultará la reseña permanentemente.`,
    textoConfirmar: 'Sí, eliminar',
    tipo: 'peligro',
    onConfirmar: () => eliminar(resena.id_resena),
  });

  const eliminar = async (id) => {
    try {
      await api.delete(`/admin/resenas/${id}`);
      setMensaje('Reseña eliminada correctamente.');
      await cargarResenas();
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setError('Error al eliminar la reseña.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const pedirBloquearUsuario = (resena) => confirmar({
    icono: '🚫',
    titulo: '¿Bloquear usuario?',
    descripcion: `Vas a bloquear la cuenta de "${resena.nombre_cliente}" (ID: ${resena.id_cliente}). El usuario no podrá iniciar sesión hasta que sea desbloqueado.`,
    textoConfirmar: 'Sí, bloquear',
    tipo: 'advertencia',
    onConfirmar: () => bloquearUsuario(resena.id_cliente, resena.nombre_cliente),
  });

  const bloquearUsuario = async (idCliente, nombreCliente) => {
    try {
      await api.patch(`/admin/clientes/${idCliente}/estado`, { estado: 'bloqueado' });
      setMensaje(`Usuario "${nombreCliente}" bloqueado correctamente.`);
      setTimeout(() => setMensaje(''), 3000);
    } catch {
      setError('Error al bloquear el usuario.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const calcularEstrellas = (cal) => {
    if (cal === null || cal === undefined) return 0;
    return Math.round(parseFloat(cal) * 4) + 1;
  };

  const renderEstrellas = (cal) => {
    const n = calcularEstrellas(cal);
    return (
      <div className="mr-estrellas">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= n ? 'mr-estrella-llena' : 'mr-estrella-vacia'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="mr-container">
        <h1 className="mr-titulo">Reseñas Reportadas</h1>

        {mensaje && <div className="mr-mensaje-exito">{mensaje}</div>}
        {error   && <div className="mr-mensaje-error">{error}</div>}

        {cargando ? (
          <p className="mr-cargando">Cargando reseñas...</p>
        ) : resenas.length === 0 ? (
          <div className="mr-vacio">
            <p>No hay reseñas reportadas pendientes de moderación.</p>
          </div>
        ) : (
          <div className="mr-lista">
            {resenas.map(r => (
              <div key={r.id_resena} className="mr-card">
                <div className="mr-card-header">
                  <div className="mr-header-izq">
                    <h2 className="mr-negocio">{r.nombre_negocio}</h2>
                    {renderEstrellas(r.calificacion)}
                  </div>
                  <div className="mr-header-der">
                    <button className="mr-btn-bloquear" onClick={() => pedirBloquearUsuario(r)}>
                      🚫 Bloquear usuario
                    </button>
                    <button className="mr-btn-eliminar" onClick={() => pedirEliminar(r)}>
                      Eliminar
                    </button>
                    <span className={`mr-badge mr-badge-${r.sentimiento}`}>
                      Reseña {r.sentimiento}
                    </span>
                  </div>
                </div>
                <div className="mr-card-body">
                  <p className="mr-comentario">{r.comentario}</p>
                  <p className="mr-autor">
                    Por: <strong>{r.nombre_cliente}</strong>
                    <span className="mr-autor-id"> (ID: {r.id_cliente})</span>
                    {r.reportada && <span className="mr-reportada">⚑ Reportada</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de confirmación homogéneo ── */}
      {modal.visible && (
        <div className="modal-overlay-mr" onClick={cerrarModal}>
          <div className="modal-card-mr" onClick={e => e.stopPropagation()}>
            {modal.icono && <div className="modal-icono-mr">{modal.icono}</div>}
            <h3 className="modal-titulo-mr">{modal.titulo}</h3>
            <p className="modal-desc-mr">{modal.descripcion}</p>
            <div className="modal-acciones-mr">
              <button className="modal-btn-mr modal-btn-cancelar-mr" onClick={cerrarModal}>
                Cancelar
              </button>
              <button
                className={`modal-btn-mr modal-btn-confirmar-mr modal-btn-${modal.tipo}-mr`}
                onClick={ejecutarConfirmacion}
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

export default ModerarResenas;