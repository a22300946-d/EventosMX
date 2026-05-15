import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import './NotificacionesGenerales.css';

// Opciones de destinatarios predefinidas
const OPCIONES_DESTINATARIOS = [
  {
    id: 'todos',
    label: 'Todos los usuarios',
    descripcion: 'Clientes y proveedores registrados',
    icono: '👥',
  },
  {
    id: 'clientes',
    label: 'Solo clientes',
    descripcion: 'Usuarios registrados como clientes',
    icono: '🙋',
  },
  {
    id: 'proveedores',
    label: 'Solo proveedores',
    descripcion: 'Negocios registrados en la plataforma',
    icono: '🏪',
  },
  {
    id: 'proveedores_pendientes',
    label: 'Proveedores pendientes de aprobación',
    descripcion: 'Negocios cuya cuenta aún no ha sido aprobada',
    icono: '⏳',
  },
  {
    id: 'clientes_sin_contratacion',
    label: 'Clientes sin contrataciones',
    descripcion: 'Clientes registrados que aún no han contratado un servicio',
    icono: '📋',
  },
  {
    id: 'proveedores_sin_servicio',
    label: 'Proveedores sin servicios publicados',
    descripcion: 'Negocios que no han registrado ningún servicio',
    icono: '📭',
  },
];

function NotificacionesGenerales() {
  const [destinatario, setDestinatario] = useState('');
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');

  const puedeEnviar = destinatario !== '' && titulo.trim() !== '' && mensaje.trim() !== '';

  const handleEnviar = () => {
    // Sin funcionalidad por ahora
    console.log({ destinatario, titulo, mensaje });
  };

  return (
    <AdminLayout>
      <div className="ng-container">
        <h1 className="ng-titulo">Notificaciones</h1>

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
                <span className="ng-opcion-icono">{op.icono}</span>
                <span className="ng-opcion-label">{op.label}</span>
                <span className="ng-opcion-desc">{op.descripcion}</span>
                {destinatario === op.id && (
                  <span className="ng-opcion-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Formulario ── */}
        <div className="ng-formulario">
          <div className="ng-campo">
            <label className="ng-label" htmlFor="ng-titulo-input">
              Título de la notificación
            </label>
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
            <label className="ng-label" htmlFor="ng-mensaje-input">
              Mensaje
            </label>
            <textarea
              id="ng-mensaje-input"
              className="ng-textarea"
              placeholder="Toca para escribir..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={6}
              maxLength={1000}
            />
            <span className="ng-contador">{mensaje.length}/1000</span>
          </div>

          {/* Resumen del destinatario seleccionado */}
          {destinatario && (
            <div className="ng-resumen">
              <span className="ng-resumen-icono">
                {OPCIONES_DESTINATARIOS.find((o) => o.id === destinatario)?.icono}
              </span>
              <span className="ng-resumen-texto">
                Se enviará a:{' '}
                <strong>
                  {OPCIONES_DESTINATARIOS.find((o) => o.id === destinatario)?.label}
                </strong>
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
              Enviar
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default NotificacionesGenerales;