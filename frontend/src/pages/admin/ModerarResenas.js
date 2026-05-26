import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { ModalConfirm, useModal } from '../../components/modales';
import './ModerarResenas.css';

function ModerarResenas() {
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { modalConfirm, mostrarConfirmacion, cerrarConfirm } = useModal();

  useEffect(() => {
    cargarResenas();
  }, []);

  const cargarResenas = async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get('/admin/resenas');
      setResenas(res.data.data);
    } catch (err) {
      setError('No se pudieron cargar las reseñas.');
    } finally {
      setCargando(false);
    }
  };

  const mostrarExito = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(''), 3000); };
  const mostrarError  = (msg) => { setError(msg);   setTimeout(() => setError(''),   3000); };

  // Eliminar reseña
  const pedirEliminar = (resena) => {
    mostrarConfirmacion({
      title: '¿Eliminar reseña?',
      message: `Vas a eliminar la reseña de "${resena.nombre_cliente}" sobre "${resena.nombre_negocio}". Esta acción ocultará la reseña permanentemente.`,
      confirmLabel: 'Sí, eliminar',
      onConfirm: async () => {
        cerrarConfirm();
        try {
          await api.delete(`/admin/resenas/${resena.id_resena}`);
          mostrarExito('Reseña eliminada correctamente.');
          await cargarResenas();
        } catch (err) {
          mostrarError('Error al eliminar la reseña.');
        }
      },
    });
  };

  // Bloquear usuario desde reseña
  const pedirBloquearUsuario = (resena) => {
    mostrarConfirmacion({
      title: '¿Bloquear usuario?',
      message: `Vas a bloquear la cuenta de "${resena.nombre_cliente}" (ID: ${resena.id_cliente}). El usuario no podrá iniciar sesión hasta que sea desbloqueado.`,
      confirmLabel: 'Sí, bloquear',
      onConfirm: async () => {
        cerrarConfirm();
        try {
          await api.patch(`/admin/clientes/${resena.id_cliente}/estado`, { estado: 'bloqueado' });
          mostrarExito(`Usuario "${resena.nombre_cliente}" bloqueado correctamente.`);
        } catch (err) {
          mostrarError('Error al bloquear el usuario.');
        }
      },
    });
  };

  const calcularEstrellas = (calificacion) => {
    if (calificacion === null || calificacion === undefined) return 0;
    return Math.round(parseFloat(calificacion) * 4) + 1;
  };

  const renderEstrellas = (calificacion) => {
    const estrellas = calcularEstrellas(calificacion);
    return (
      <div className="mr-estrellas">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= estrellas ? 'mr-estrella-llena' : 'mr-estrella-vacia'}>
            ★
          </span>
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
                    <button
                      className="mr-btn-bloquear"
                      onClick={() => pedirBloquearUsuario(r)}
                      title={`Bloquear a ${r.nombre_cliente}`}
                    >
                      🚫 Bloquear usuario
                    </button>
                    <button
                      className="mr-btn-eliminar"
                      onClick={() => pedirEliminar(r)}
                    >
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

      <ModalConfirm
        config={modalConfirm}
        onConfirm={modalConfirm?.onConfirm}
        onCancel={cerrarConfirm}
      />
    </AdminLayout>
  );
}

export default ModerarResenas;