import React from 'react';
import './MensajeChat.css';

/* ─────────────────────────────────────────────────────────────────────────
   Detectores: identifican si el contenido es un mensaje especial
───────────────────────────────────────────────────────────────────────── */
const esSolicitud = (contenido) =>
  contenido?.includes('📋 Nueva solicitud de cotización') ||
  contenido?.startsWith('📋');

const esPropuesta = (contenido) =>
  contenido?.includes('**Mi Propuesta**') ||
  contenido?.includes('**Precio Total:**');

/* ─────────────────────────────────────────────────────────────────────────
   Parser de la solicitud de cotización
   Extrae los campos del texto plano generado en solicitudController.js
───────────────────────────────────────────────────────────────────────── */
const parsearSolicitud = (texto) => {
  const datos = {};

  const matchTipo     = texto.match(/🎉 Tipo de evento:\s*(.+)/);
  const matchFecha    = texto.match(/📅 Fecha:\s*(.+)/);
  const matchInvitados= texto.match(/👥 Número de invitados:\s*(.+)/);
  const matchPresup   = texto.match(/💰 Presupuesto estimado:\s*(.+)/);
  const matchPromo    = texto.match(/🏷️ Promoción aplicada:\s*(.+)/);
  const matchDetalles = texto.match(/📝 Detalles adicionales:\n([\s\S]+?)(?:\n\n|$)/);
  const matchMensaje  = texto.match(/¡Hola![\s\S]+$/);

  if (matchTipo)      datos.tipo_evento       = matchTipo[1].trim();
  if (matchFecha)     datos.fecha             = matchFecha[1].trim();
  if (matchInvitados) datos.numero_invitados  = matchInvitados[1].trim();
  if (matchPresup)    datos.presupuesto       = matchPresup[1].trim();
  if (matchPromo)     datos.promocion         = matchPromo[1].trim();
  if (matchDetalles)  datos.descripcion       = matchDetalles[1].trim();
  if (matchMensaje)   datos.saludo            = matchMensaje[0].trim();

  return datos;
};

/* ─────────────────────────────────────────────────────────────────────────
   Parser de la propuesta del proveedor
   Extrae los campos del texto Markdown generado en Chat.js/handleEnviarPropuesta
───────────────────────────────────────────────────────────────────────── */
const parsearPropuesta = (texto) => {
  const datos = {};

  const matchPrecio   = texto.match(/\*\*Precio Total:\*\*\s*(.+)/);
  const matchDesc     = texto.match(/\*\*Descripción:\*\*\n([\s\S]+?)(?=\n\*\*|\n\n🏷️|¿Te parece|$)/);
  const matchFecha    = texto.match(/\*\*Fecha:\*\*\s*(.+)/);
  const matchHora     = texto.match(/\*\*Hora:\*\*\s*(.+)/);
  const matchNotas    = texto.match(/\*\*Notas:\*\*\n([\s\S]+?)(?=\n\n|¿Te parece|🏷️|$)/);
  const matchPromo    = texto.match(/🏷️\s*\*\*Promoción[^:]*:\*\*\s*(.+?)(?:\n|$)/);
  const matchCierre   = texto.match(/¿Te parece bien[\s\S]+$/);

  if (matchPrecio)  datos.precio       = matchPrecio[1].trim();
  if (matchDesc)    datos.descripcion  = matchDesc[1].trim();
  if (matchFecha)   datos.fecha        = matchFecha[1].trim();
  if (matchHora)    datos.hora         = matchHora[1].trim();
  if (matchNotas)   datos.notas        = matchNotas[1].trim();
  if (matchPromo)   datos.promocion    = matchPromo[1].trim();
  if (matchCierre)  datos.cierre       = matchCierre[0].trim();

  return datos;
};

/* ─────────────────────────────────────────────────────────────────────────
   Tarjeta: Solicitud de cotización (lado cliente — burbujas derechas)
───────────────────────────────────────────────────────────────────────── */
const TarjetaSolicitud = ({ contenido, esPropio }) => {
  const d = parsearSolicitud(contenido);

  return (
    <div className={`msg-card msg-card-solicitud ${esPropio ? 'msg-card-propio' : 'msg-card-otro'}`}>
      {/* Encabezado */}
      <div className="msg-card-header">
        <span className="msg-card-icon">📋</span>
        <span className="msg-card-titulo">Solicitud de cotización</span>
      </div>

      {/* Filas de datos */}
      <div className="msg-card-body">
        {d.tipo_evento && (
          <div className="msg-card-fila">
            <span className="msg-card-emoji">🎉</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Tipo de evento</span>
              <span className="msg-card-valor">{d.tipo_evento}</span>
            </div>
          </div>
        )}
        {d.fecha && (
          <div className="msg-card-fila">
            <span className="msg-card-emoji">📅</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Fecha</span>
              <span className="msg-card-valor">{d.fecha}</span>
            </div>
          </div>
        )}
        {d.numero_invitados && (
          <div className="msg-card-fila">
            <span className="msg-card-emoji">👥</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Invitados</span>
              <span className="msg-card-valor">{d.numero_invitados}</span>
            </div>
          </div>
        )}
        {d.presupuesto && (
          <div className="msg-card-fila">
            <span className="msg-card-emoji">💰</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Presupuesto estimado</span>
              <span className="msg-card-valor">{d.presupuesto}</span>
            </div>
          </div>
        )}
        {d.promocion && (
          <div className="msg-card-fila msg-card-fila-promo">
            <span className="msg-card-emoji">🏷️</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Promoción aplicada</span>
              <span className="msg-card-valor">{d.promocion}</span>
            </div>
          </div>
        )}
        {d.descripcion && (
          <div className="msg-card-descripcion">
            <span className="msg-card-label">📝 Detalles adicionales</span>
            <p className="msg-card-descripcion-texto">{d.descripcion}</p>
          </div>
        )}
      </div>

      {/* Mensaje de cierre */}
      {d.saludo && (
        <div className="msg-card-footer">
          {d.saludo}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Tarjeta: Propuesta del proveedor (lado proveedor — burbujas izquierdas)
───────────────────────────────────────────────────────────────────────── */
const TarjetaPropuesta = ({ contenido, esPropio }) => {
  const d = parsearPropuesta(contenido);

  return (
    <div className={`msg-card msg-card-propuesta ${esPropio ? 'msg-card-propio' : 'msg-card-otro'}`}>
      {/* Encabezado */}
      <div className="msg-card-header">
        <span className="msg-card-icon">📄</span>
        <span className="msg-card-titulo">Propuesta de servicio</span>
      </div>

      <div className="msg-card-body">
        {/* Precio destacado */}
        {d.precio && (
          <div className="msg-card-precio-bloque">
            <span className="msg-card-precio-label">Precio total</span>
            <span className="msg-card-precio-valor">{d.precio}</span>
          </div>
        )}

        {/* Fecha y hora en fila */}
        {(d.fecha || d.hora) && (
          <div className="msg-card-fila-duo">
            {d.fecha && (
              <div className="msg-card-fila">
                <span className="msg-card-emoji">📅</span>
                <div className="msg-card-fila-contenido">
                  <span className="msg-card-label">Fecha</span>
                  <span className="msg-card-valor">{d.fecha}</span>
                </div>
              </div>
            )}
            {d.hora && (
              <div className="msg-card-fila">
                <span className="msg-card-emoji">🕐</span>
                <div className="msg-card-fila-contenido">
                  <span className="msg-card-label">Hora</span>
                  <span className="msg-card-valor">{d.hora}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Descripción */}
        {d.descripcion && (
          <div className="msg-card-descripcion">
            <span className="msg-card-label">Descripción del servicio</span>
            <p className="msg-card-descripcion-texto">{d.descripcion}</p>
          </div>
        )}

        {/* Notas */}
        {d.notas && (
          <div className="msg-card-descripcion msg-card-notas">
            <span className="msg-card-label">📌 Notas</span>
            <p className="msg-card-descripcion-texto">{d.notas}</p>
          </div>
        )}

        {/* Promoción */}
        {d.promocion && (
          <div className="msg-card-fila msg-card-fila-promo">
            <span className="msg-card-emoji">🏷️</span>
            <div className="msg-card-fila-contenido">
              <span className="msg-card-label">Promoción incluida</span>
              <span className="msg-card-valor">{d.promocion}</span>
            </div>
          </div>
        )}
      </div>

      {/* Cierre */}
      {d.cierre && (
        <div className="msg-card-footer">
          {d.cierre}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────
   Componente principal: decide qué renderizar
───────────────────────────────────────────────────────────────────────── */
const MensajeChat = ({ mensaje, esPropio }) => {
  const { contenido } = mensaje;

  if (esSolicitud(contenido)) {
    return <TarjetaSolicitud contenido={contenido} esPropio={esPropio} />;
  }
  if (esPropuesta(contenido)) {
    return <TarjetaPropuesta contenido={contenido} esPropio={esPropio} />;
  }

  // Mensaje normal: texto plano
  return <div className="mensaje-texto">{contenido}</div>;
};

export default MensajeChat;