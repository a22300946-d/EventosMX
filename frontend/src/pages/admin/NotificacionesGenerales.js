import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import './NotificacionesGenerales.css';
import {
  FaUsers,       // 👥 todos
  FaUser,        // 🙋 clientes
  FaStore,       // 🏪 proveedores
  FaClock,       // ⏳ proveedores_pendientes
  FaClipboardList, // 📋 clientes_sin_contratacion
  FaInbox,       // 📭 proveedores_sin_servicio
  FaCheck,       // ✓ check activo
} from 'react-icons/fa';

const OPCIONES_DESTINATARIOS = [
  { id: 'todos',                   label: 'Todos los usuarios',                      descripcion: 'Clientes y proveedores registrados',                  Icono: FaUsers },
  { id: 'clientes',               label: 'Solo clientes',                           descripcion: 'Usuarios registrados como clientes',                  Icono: FaUser },
  { id: 'proveedores',             label: 'Solo proveedores',                        descripcion: 'Negocios registrados en la plataforma',               Icono: FaStore },
  { id: 'proveedores_pendientes',  label: 'Proveedores pendientes de aprobación',    descripcion: 'Negocios cuya cuenta aún no ha sido aprobada',        Icono: FaClock },
  { id: 'clientes_sin_contratacion', label: 'Clientes sin contrataciones',             descripcion: 'Clientes registrados que aún no han contratado un servicio', Icono: FaClipboardList },
  { id: 'proveedores_sin_servicio', label: 'Proveedores sin servicios publicados',    descripcion: 'Negocios que no han registrado ningún servicio',      Icono: FaInbox },
];

function NotificacionesGenerales() {
  const [destinatario, setDestinatario] = useState('');
  const [titulo, setTitulo]             = useState('');
  const [mensaje, setMensaje]           = useState('');
  const [enviando, setEnviando]         = useState(false);
  const [resultado, setResultado]       = useState(null);

  const puedeEnviar = destinatario !== '' && titulo.trim() !== '' && mensaje.trim() !== '' && !enviando;

  const handleEnviar = async () => {
    if (!puedeEnviar) return;
    setEnviando(true);
    setResultado(null);
    try {
      await api.post('/admin/notificaciones', { destinatario, titulo: titulo.trim(), mensaje: mensaje.trim() });
      setResultado({ ok: true, msg: '¡Notificación enviada correctamente!' });
      setDestinatario('');
      setTitulo('');
      setMensaje('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al enviar la notificación';
      setResultado({ ok: false, msg });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AdminLayout>
      <div className="ng-container">
        <h1 className="ng-titulo">Notificaciones</h1>

        {resultado && (
          <div className={`ng-alerta ${resultado.ok ? 'ng-alerta-ok' : 'ng-alerta-error'}`}>
            {resultado.msg}
          </div>
        )}

        {/* ── Selector de destinatarios ── */}
        <div className="ng-seccion">
          <h2 className="ng-subtitulo">¿A quién va dirigida la notificación?</h2>
          <div className="ng-opciones-grid">
            {OPCIONES_DESTINATARIOS.map((op) => (
              <button
                key={op.id}
                className={`ng-opcion-btn ${destinatario === op.id ? 'ng-opcion-activa' : ''}`}
                onClick={() => setDestinatario(op.id)}
                type="button"
              >
                <span className="ng-opcion-icono"><op.Icono /></span>
                <span className="ng-opcion-label">{op.label}</span>
                <span className="ng-opcion-desc">{op.descripcion}</span>
                {destinatario === op.id && <span className="ng-opcion-check"><FaCheck /></span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Formulario ── */}
        <div className="ng-formulario">
          <div className="ng-campo">
            <label className="ng-label" htmlFor="ng-titulo-input">Título de la notificación</label>
            <input
              id="ng-titulo-input"
              className="ng-input"
              type="text"
              placeholder="Ingresa el título de la notificación"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="ng-campo">
            <label className="ng-label" htmlFor="ng-mensaje-input">Mensaje</label>
            <textarea
              id="ng-mensaje-input"
              className="ng-textarea"
              placeholder="Escribe el mensaje de la notificación..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={6}
              maxLength={1000}
            />
            <span className="ng-contador">{mensaje.length}/1000</span>
          </div>

          {destinatario && (
            <div className="ng-resumen">
              <span className="ng-resumen-icono">
                {(() => { const op = OPCIONES_DESTINATARIOS.find((o) => o.id === destinatario); return op ? <op.Icono /> : null; })()}
              </span>
              <span className="ng-resumen-texto">
                Se enviará a: <strong>{OPCIONES_DESTINATARIOS.find((o) => o.id === destinatario)?.label}</strong>
              </span>
            </div>
          )}

          <div className="ng-acciones">
            <button
              className={`ng-btn-enviar ${!puedeEnviar ? 'ng-btn-deshabilitado' : ''}`}
              onClick={handleEnviar}
              disabled={!puedeEnviar}
              type="button"
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default NotificacionesGenerales;