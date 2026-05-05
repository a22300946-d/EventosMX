import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ConversacionesList.css';

const ConversacionesList = ({ conversaciones, conversacionActiva, usuarioTipo }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const formatearHora = (fecha) => {
    if (!fecha) return '';
    
    const date = new Date(fecha);
    const hoy = new Date();
    
    // Si es hoy, mostrar hora
    if (date.toDateString() === hoy.toDateString()) {
      const horas = date.getHours().toString().padStart(2, '0');
      const minutos = date.getMinutes().toString().padStart(2, '0');
      return `${horas}:${minutos}`;
    }
    
    // Si fue ayer
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (date.toDateString() === ayer.toDateString()) {
      return 'Ayer';
    }
    
    // Si fue esta semana
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const diffDias = Math.floor((hoy - date) / (1000 * 60 * 60 * 24));
    if (diffDias < 7) {
      return diasSemana[date.getDay()];
    }
    
    // Fecha completa
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${dia}/${mes}`;
  };

  const truncarMensaje = (mensaje, maxLength = 40) => {
    if (!mensaje) return '';
    if (mensaje.length <= maxLength) return mensaje;
    return mensaje.substring(0, maxLength) + '...';
  };

  const getNombreContacto = (conversacion) => {
    if (usuarioTipo === 'cliente') {
      return conversacion.nombre_proveedor;
    } else {
      return conversacion.nombre_cliente;
    }
  };

  const conversacionesFiltradas = conversaciones.filter((conv) => {
    const nombre = getNombreContacto(conv).toLowerCase();
    return nombre.includes(searchTerm.toLowerCase());
  });

  const handleClickConversacion = (id_solicitud) => {
    navigate(`/chat/${id_solicitud}`);
  };

  return (
    <div className="conversaciones-sidebar">
      {/* Buscador */}
      <div className="conversaciones-search">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="conversaciones-search-input"
        />
      </div>

      {/* Lista de conversaciones */}
      <div className="conversaciones-list">
        {conversacionesFiltradas.length === 0 ? (
          <div className="conversaciones-empty">
            <p>No hay conversaciones</p>
          </div>
        ) : (
          conversacionesFiltradas.map((conversacion) => (
            <div
              key={conversacion.id_solicitud}
              className={`conversacion-item ${
                conversacion.id_solicitud === parseInt(conversacionActiva)
                  ? 'conversacion-activa'
                  : ''
              }`}
              onClick={() => handleClickConversacion(conversacion.id_solicitud)}
            >
              {/* Avatar */}
              <div className="conversacion-avatar">
                {getNombreContacto(conversacion).charAt(0)}
              </div>

              {/* Info */}
              <div className="conversacion-info">
                <div className="conversacion-header">
                  <h4 className="conversacion-nombre">
                    {getNombreContacto(conversacion)}
                  </h4>
                  <span className="conversacion-hora">
                    {formatearHora(conversacion.fecha_ultimo_mensaje)}
                  </span>
                </div>
                <div className="conversacion-preview">
                  <p className="conversacion-ultimo-mensaje">
                    {truncarMensaje(conversacion.ultimo_mensaje)}
                  </p>
                  {conversacion.mensajes_no_leidos > 0 && (
                    <span className="conversacion-badge">
                      {conversacion.mensajes_no_leidos}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversacionesList;