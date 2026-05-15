import React, { useState, useEffect, useCallback, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import './GestionCatalogos.css';

// ── Emojis disponibles por categoría ──────────────────────────
const EMOJIS_SERVICIO = {
  'Fotografía y video': ['📷', '📸', '🎥', '🎬', '🎞️', '📹', '🎦'],
  'Música y entretenimiento': ['🎵', '🎶', '🎸', '🎹', '🎺', '🥁', '🎤', '🎧', '🎻', '🎷'],
  'Comida y bebida': ['🍽️', '🥂', '🍰', '🎂', '🍷', '🥗', '🍱', '☕', '🍕', '🥘'],
  'Decoración y flores': ['💐', '🌸', '🌺', '🌻', '🎨', '✨', '🎀', '🪄', '🎊', '🎉'],
  'Lugar y espacios': ['🏛️', '🏰', '⛪', '🏟️', '🎪', '🏠', '🌳', '🌅', '🛖', '⛺'],
  'Logística y transporte': ['🚌', '🚗', '✈️', '🚢', '🏎️', '🚐', '🛻', '🚁'],
  'Iluminación y sonido': ['💡', '🔦', '🕯️', '🎇', '🎆', '🔊', '🎙️', '📡'],
  'Personal y servicios': ['👨‍🍳', '💃', '🤹', '🎩', '💇', '💄', '👗', '🎭', '🧑‍🎤'],
  'Otros': ['⭐', '🌟', '💫', '🎯', '🏆', '🎁', '📋', '🔑', '💼', '🛍️'],
};

const EMOJIS_EVENTO = {
  'Celebraciones personales': ['🎂', '🎉', '🎊', '🥳', '🎈', '🎁', '🥂'],
  'Bodas y XV años': ['💍', '👰', '🤵', '💒', '💐', '🌸', '👑'],
  'Corporativos': ['💼', '🏢', '📊', '🤝', '🎯', '📋', '💡'],
  'Educativos': ['🎓', '📚', '🏫', '✏️', '🏅', '🥇', '📜'],
  'Culturales y sociales': ['🎭', '🎨', '🎪', '🎬', '🎵', '🎤', '🖼️'],
  'Deportivos': ['🏆', '⚽', '🏀', '🎾', '🏊', '🤸', '🏋️'],
  'Religiosos': ['⛪', '🕌', '🙏', '✝️', '🕍', '📿'],
  'Otros': ['⭐', '🌟', '🎯', '🌈', '🦋', '🌺', '🎠'],
};

// ── Componente EmojiPicker ─────────────────────────────────────
function EmojiPicker({ grupos, valor, onChange, placeholder }) {
  const [abierto, setAbierto] = useState(false);
  const [grupoActivo, setGrupoActivo] = useState(Object.keys(grupos)[0]);
  const ref = useRef(null);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    if (abierto) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  const seleccionar = (emoji) => {
    onChange(emoji);
    setAbierto(false);
  };

  const limpiar = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="ep-wrapper" ref={ref}>
      <button
        type="button"
        className={`ep-trigger ${abierto ? 'ep-trigger-abierto' : ''} ${valor ? 'ep-trigger-con-valor' : ''}`}
        onClick={() => setAbierto((v) => !v)}
        title="Seleccionar ícono"
      >
        {valor ? (
          <>
            <span className="ep-trigger-emoji">{valor}</span>
            <span className="ep-trigger-label">Ícono seleccionado</span>
            <button type="button" className="ep-clear" onClick={limpiar} title="Quitar ícono">×</button>
          </>
        ) : (
          <>
            <span className="ep-trigger-placeholder-icon">😊</span>
            <span className="ep-trigger-label ep-trigger-vacio">{placeholder || 'Seleccionar ícono'}</span>
            <span className="ep-chevron">{abierto ? '▲' : '▼'}</span>
          </>
        )}
      </button>

      {abierto && (
        <div className="ep-dropdown">
          {/* Pestañas de grupo */}
          <div className="ep-grupos">
            {Object.keys(grupos).map((g) => (
              <button
                key={g}
                type="button"
                className={`ep-grupo-tab ${grupoActivo === g ? 'ep-grupo-activo' : ''}`}
                onClick={() => setGrupoActivo(g)}
                title={g}
              >
                {grupos[g][0]}
              </button>
            ))}
          </div>
          {/* Etiqueta del grupo activo */}
          <p className="ep-grupo-label">{grupoActivo}</p>
          {/* Grid de emojis */}
          <div className="ep-grid">
            {grupos[grupoActivo].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`ep-emoji-btn ${valor === emoji ? 'ep-emoji-seleccionado' : ''}`}
                onClick={() => seleccionar(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Configuración de secciones ─────────────────────────────────
const SECCIONES = [
  {
    id: 'ciudades',
    label: 'Ciudades',
    icono: '📍',
    endpoint: '/admin/catalogos/ciudades',
    campoNombre: 'nombre_ciudad',
    campoId: 'id_lugar',
    placeholder: 'Ej: Guadalajara',
    descripcion: 'Ciudades disponibles para que clientes y proveedores seleccionen su ubicación.',
  },
  {
    id: 'categorias',
    label: 'Tipos de servicio',
    icono: '🛠️',
    endpoint: '/admin/catalogos/categorias',
    campoNombre: 'nombre_categoria',
    campoId: 'id_categoria',
    placeholder: 'Ej: Fotografía',
    campoExtra: { key: 'icono', label: 'Ícono', placeholder: 'Seleccionar ícono' },
    gruposEmoji: EMOJIS_SERVICIO,
    descripcion: 'Categorías de servicios que los proveedores pueden ofrecer.',
  },
  {
    id: 'tiposEvento',
    label: 'Tipos de evento',
    icono: '🎉',
    endpoint: '/admin/catalogos/tipos-evento',
    campoNombre: 'nombre_tipo',
    campoId: 'id_tipo_evento',
    placeholder: 'Ej: Boda',
    campoExtra: { key: 'icono', label: 'Ícono', placeholder: 'Seleccionar ícono' },
    gruposEmoji: EMOJIS_EVENTO,
    descripcion: 'Tipos de eventos que los clientes pueden seleccionar al buscar servicios.',
  },
];

// ── Modal de confirmación ──────────────────────────────────────
function ModalConfirmar({ modal, onCancelar, onConfirmar }) {
  if (!modal.visible) return null;
  return (
    <div className="gc-modal-overlay" onClick={onCancelar}>
      <div className="gc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gc-modal-icono">🗑️</div>
        <h3 className="gc-modal-titulo">{modal.titulo}</h3>
        <p className="gc-modal-desc">{modal.descripcion}</p>
        <div className="gc-modal-acciones">
          <button className="gc-modal-btn-cancelar" onClick={onCancelar}>Cancelar</button>
          <button className="gc-modal-btn-confirmar" onClick={onConfirmar}>Sí, eliminar</button>
        </div>
      </div>
    </div>
  );
}

// ── Panel de una sección ───────────────────────────────────────
function PanelSeccion({ seccion }) {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoExtra, setNuevoExtra] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [modal, setModal] = useState({ visible: false, titulo: '', descripcion: '', id: null });

  const mostrarExito = (msg) => { setExito(msg); setTimeout(() => setExito(''), 3000); };
  const mostrarError  = (msg) => { setError(msg);  setTimeout(() => setError(''),  4000); };

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await api.get(seccion.endpoint);
      setItems(res.data.data || []);
    } catch {
      mostrarError('No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  }, [seccion.endpoint]);

  useEffect(() => { cargar(); }, [cargar]);

  const handleAgregar = async () => {
    if (!nuevoNombre.trim()) return;
    setAgregando(true);
    try {
      const body = { [seccion.campoNombre]: nuevoNombre.trim() };
      if (seccion.campoExtra) body[seccion.campoExtra.key] = nuevoExtra;
      await api.post(seccion.endpoint, body);
      setNuevoNombre('');
      setNuevoExtra('');
      mostrarExito('Elemento agregado correctamente.');
      await cargar();
    } catch {
      mostrarError('Error al agregar el elemento.');
    } finally {
      setAgregando(false);
    }
  };

  const pedirEliminar = (item) => {
    setModal({
      visible: true,
      titulo: `¿Eliminar "${item[seccion.campoNombre]}"?`,
      descripcion: 'Esta acción eliminará el elemento del catálogo. Los registros existentes que lo usen podrían verse afectados.',
      id: item[seccion.campoId],
    });
  };

  const confirmarEliminar = async () => {
    try {
      await api.delete(`${seccion.endpoint}/${modal.id}`);
      mostrarExito('Elemento eliminado correctamente.');
      await cargar();
    } catch {
      mostrarError('Error al eliminar el elemento.');
    } finally {
      setModal({ visible: false, titulo: '', descripcion: '', id: null });
    }
  };

  return (
    <div className="gc-panel">
      <div className="gc-panel-header">
        <span className="gc-panel-icono">{seccion.icono}</span>
        <div>
          <h2 className="gc-panel-titulo">{seccion.label}</h2>
          <p className="gc-panel-desc">{seccion.descripcion}</p>
        </div>
      </div>

      {exito && <div className="gc-msg-exito">{exito}</div>}
      {error  && <div className="gc-msg-error">{error}</div>}

      {/* Formulario para agregar */}
      <div className="gc-form-agregar">
        <div className="gc-form-campos">
          <input
            className="gc-input"
            type="text"
            placeholder={seccion.placeholder}
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAgregar()}
            maxLength={80}
          />
          {seccion.campoExtra && (
            <EmojiPicker
              grupos={seccion.gruposEmoji}
              valor={nuevoExtra}
              onChange={setNuevoExtra}
              placeholder={seccion.campoExtra.placeholder}
            />
          )}
        </div>
        <button
          className={`gc-btn-agregar ${!nuevoNombre.trim() || agregando ? 'gc-btn-disabled' : ''}`}
          onClick={handleAgregar}
          disabled={!nuevoNombre.trim() || agregando}
        >
          + Agregar
        </button>
      </div>

      {/* Lista de elementos */}
      {cargando ? (
        <p className="gc-cargando">Cargando...</p>
      ) : items.length === 0 ? (
        <div className="gc-vacio">No hay elementos registrados todavía.</div>
      ) : (
        <ul className="gc-lista">
          {items.map((item) => (
            <li key={item[seccion.campoId]} className="gc-item">
              <div className="gc-item-info">
                {seccion.campoExtra && item[seccion.campoExtra.key] && (
                  <span className="gc-item-emoji">{item[seccion.campoExtra.key]}</span>
                )}
                <span className="gc-item-nombre">{item[seccion.campoNombre]}</span>
              </div>
              <button
                className="gc-btn-eliminar"
                onClick={() => pedirEliminar(item)}
                title="Eliminar"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <ModalConfirmar
        modal={modal}
        onCancelar={() => setModal({ visible: false })}
        onConfirmar={confirmarEliminar}
      />
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
function GestionCatalogos() {
  const [seccionActiva, setSeccionActiva] = useState(SECCIONES[0].id);
  const seccion = SECCIONES.find((s) => s.id === seccionActiva);

  return (
    <AdminLayout>
      <div className="gc-container">
        <h1 className="gc-titulo">Gestión de catálogos</h1>

        {/* Pestañas */}
        <div className="gc-tabs">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              className={`gc-tab ${seccionActiva === s.id ? 'gc-tab-activa' : ''}`}
              onClick={() => setSeccionActiva(s.id)}
              type="button"
            >
              <span>{s.icono}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Panel activo — se remonta al cambiar pestaña para resetear estado */}
        <PanelSeccion key={seccionActiva} seccion={seccion} />
      </div>
    </AdminLayout>
  );
}

export default GestionCatalogos;