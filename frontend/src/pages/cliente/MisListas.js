import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import "./MisListas.css";

function MisListas() {
  const navigate = useNavigate();
  const [listas, setListas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRenombrarModal, setShowRenombrarModal] = useState(false);
  const [listaARenombrar, setListaARenombrar] = useState(null);
  const [nuevoNombreLista, setNuevoNombreLista] = useState("");
  const [nuevaDescripcionLista, setNuevaDescripcionLista] = useState("");
  const [nombreNuevaLista, setNombreNuevaLista] = useState("");
  const [descripcionNuevaLista, setDescripcionNuevaLista] = useState("");
  const [creandoLista, setCreandoLista] = useState(false);
  const [renombrandoLista, setRenombrandoLista] = useState(false);
  const [error, setError] = useState("");
  const [errorRenombrar, setErrorRenombrar] = useState("");
  const [procesando, setProcesando] = useState({});
  const [mostrarMenuLista, setMostrarMenuLista] = useState(null);

  useEffect(() => {
    cargarListas();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.lista-menu-container')) {
        setMostrarMenuLista(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const cargarListas = async () => {
    try {
      setLoading(true);
      const response = await clienteService.obtenerMisListas();
      
      console.log('Datos de listas:', response.data.data); // Debug
      
      const listasFiltradas = (response.data.data || []).filter(
        (lista) => lista.nombre_lista !== "Favoritos"
      );
      
      setListas(listasFiltradas);
    } catch (error) {
      console.error("Error al cargar listas:", error);
    } finally {
      setLoading(false);
    }
  };

  const validarNombreLista = (nombre) => {
    if (!nombre.trim()) {
      return "El nombre del evento es obligatorio";
    }
    if (nombre.length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (nombre.length > 100) {
      return "El nombre no puede exceder 100 caracteres";
    }
    if (nombre.trim().toLowerCase() === "favoritos") {
      return 'El nombre "Favoritos" está reservado para el sistema';
    }
    return "";
  };

  const crearLista = async () => {
    const errorValidacion = validarNombreLista(nombreNuevaLista);
    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setCreandoLista(true);
      setError("");

      await clienteService.crearLista({
        nombre_lista: nombreNuevaLista.trim(),
        descripcion: descripcionNuevaLista.trim() || null,
      });

      setNombreNuevaLista("");
      setDescripcionNuevaLista("");
      setShowModal(false);

      await cargarListas();
    } catch (error) {
      console.error("Error al crear lista:", error);
      setError(error.response?.data?.message || "Error al crear el evento");
    } finally {
      setCreandoLista(false);
    }
  };

  const abrirModalRenombrar = (lista, e) => {
    e.stopPropagation();
    setMostrarMenuLista(null);
    setListaARenombrar(lista);
    setNuevoNombreLista(lista.nombre_lista);
    setNuevaDescripcionLista(lista.descripcion || "");
    setErrorRenombrar("");
    setShowRenombrarModal(true);
  };

  const renombrarLista = async () => {
    const errorValidacion = validarNombreLista(nuevoNombreLista);
    if (errorValidacion) {
      setErrorRenombrar(errorValidacion);
      return;
    }

    try {
      setRenombrandoLista(true);
      setErrorRenombrar("");

      await clienteService.actualizarLista(listaARenombrar.id_lista, {
        nombre_lista: nuevoNombreLista.trim(),
        descripcion: nuevaDescripcionLista.trim() || null,
      });

      setShowRenombrarModal(false);
      setListaARenombrar(null);
      await cargarListas();
      
      alert("✅ Lista actualizada correctamente");
    } catch (error) {
      console.error("Error al renombrar lista:", error);
      setErrorRenombrar(error.response?.data?.message || "Error al actualizar la lista");
    } finally {
      setRenombrandoLista(false);
    }
  };

  const duplicarLista = async (lista, e) => {
    e.stopPropagation();
    setMostrarMenuLista(null);

    try {
      setProcesando((prev) => ({ ...prev, [lista.id_lista]: true }));

      let nuevoNombre = `${lista.nombre_lista} (Copia)`;
      let contador = 1;

      while (listas.some((l) => l.nombre_lista === nuevoNombre)) {
        contador++;
        nuevoNombre = `${lista.nombre_lista} (Copia ${contador})`;
      }

      await clienteService.crearLista({
        nombre_lista: nuevoNombre,
        descripcion: lista.descripcion || null,
      });

      await cargarListas();
      alert(`✅ Lista "${nuevoNombre}" creada exitosamente`);
    } catch (error) {
      console.error("Error al duplicar lista:", error);
      alert("❌ Error al duplicar la lista");
    } finally {
      setProcesando((prev) => ({ ...prev, [lista.id_lista]: false }));
    }
  };

  const eliminarLista = async (lista, e) => {
    e.stopPropagation();
    setMostrarMenuLista(null);

    const confirmacion = window.confirm(
      `¿Estás seguro de eliminar "${lista.nombre_lista}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      setProcesando((prev) => ({ ...prev, [lista.id_lista]: true }));

      await clienteService.eliminarLista(lista.id_lista);

      setListas(listas.filter((l) => l.id_lista !== lista.id_lista));
      alert("✅ Lista eliminada correctamente");
    } catch (error) {
      console.error("Error al eliminar lista:", error);
      alert("❌ Error al eliminar la lista");
    } finally {
      setProcesando((prev) => ({ ...prev, [lista.id_lista]: false }));
    }
  };

  const toggleMenu = (idLista, e) => {
    e.stopPropagation();
    setMostrarMenuLista(mostrarMenuLista === idLista ? null : idLista);
  };

  const verDetallesLista = (idLista) => {
    navigate(`/cliente/listas/${idLista}`);
  };

  const verProveedoresGuardados = () => {
    navigate("/cliente/favoritos");
  };

  const getEstadoBadge = (estado) => {
    if (estado === "completo") {
      return { class: "badge-success", text: "✓ Evento completo" };
    }
    return { class: "badge-warning", text: "⏳ En progreso" };
  };

  return (
    <ClienteLayout>
      <div className="listas-container">
        <div className="listas-header">
          <h1>Mis Eventos</h1>
          <button className="btn-crear-evento" onClick={() => setShowModal(true)}>
            + Crear Evento
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando tus eventos...</p>
          </div>
        ) : (
          <div className="listas-grid">
            {/* Proveedores Guardados */}
            <div className="lista-card lista-favoritos" onClick={verProveedoresGuardados}>
              <div className="lista-icon">
                <span className="icon-favorito">♡</span>
              </div>
              <div className="lista-content">
                <h3>Proveedores Guardados</h3>
                <p className="lista-descripcion">Todos tus proveedores favoritos</p>
              </div>
              <button className="btn-ver-lista">Ver guardados →</button>
            </div>

            {/* Listas creadas */}
            {listas.length === 0 ? (
              <div className="empty-state-card">
                <div className="empty-icon">📋</div>
                <h3>No tienes eventos creados</h3>
                <p>Crea tu primer evento para organizar proveedores</p>
                <button className="btn-crear-primero" onClick={() => setShowModal(true)}>
                  + Crear mi primer evento
                </button>
              </div>
            ) : (
              listas.map((lista) => {
                // Cálculo robusto del progreso
                const totalProveedores = Number(lista.total_proveedores) || 0;
                const proveedoresAdquiridos = Number(lista.proveedores_adquiridos) || 0;
                
                let progreso = 0;
                if (totalProveedores > 0) {
                  progreso = Math.round((proveedoresAdquiridos / totalProveedores) * 100);
                }

                const estado =
                  proveedoresAdquiridos === totalProveedores && totalProveedores > 0
                    ? "completo"
                    : "pendiente";
                const badge = getEstadoBadge(estado);
                const estaProcesando = procesando[lista.id_lista];

                return (
                  <div
                    key={lista.id_lista}
                    className={`lista-card ${estaProcesando ? "lista-procesando" : ""}`}
                    onClick={() => !estaProcesando && verDetallesLista(lista.id_lista)}
                  >
                    {/* Botón de menú */}
                    <div className="lista-menu-container">
                      <button
                        className="btn-menu-lista"
                        onClick={(e) => toggleMenu(lista.id_lista, e)}
                        disabled={estaProcesando}
                      >
                        ⋮
                      </button>

                      {mostrarMenuLista === lista.id_lista && (
                        <div className="menu-desplegable">
                          <button
                            className="menu-item"
                            onClick={(e) => abrirModalRenombrar(lista, e)}
                          >
                            <span className="menu-icon">✏️</span>
                            Renombrar
                          </button>
                          <button
                            className="menu-item"
                            onClick={(e) => duplicarLista(lista, e)}
                          >
                            <span className="menu-icon">📋</span>
                            Duplicar
                          </button>
                          <button
                            className="menu-item menu-item-danger"
                            onClick={(e) => eliminarLista(lista, e)}
                          >
                            <span className="menu-icon">🗑️</span>
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="lista-header-card">
                      <h3>{lista.nombre_lista}</h3>
                      <span className={`badge ${badge.class}`}>{badge.text}</span>
                    </div>

                    {lista.descripcion && (
                      <p className="lista-descripcion">{lista.descripcion}</p>
                    )}

                    <div className="lista-progreso">
                      <div className="progreso-bar-container">
                        <div className="progreso-bar" style={{ width: `${progreso}%` }}></div>
                      </div>
                      <span className="progreso-text">{progreso}% completado</span>
                    </div>

                    <div className="lista-stats">
                      <div className="stat-item">
                        <span className="stat-icon">📦</span>
                        <span className="stat-value">{totalProveedores}</span>
                        <span className="stat-label">Proveedores</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">✓</span>
                        <span className="stat-value">{proveedoresAdquiridos}</span>
                        <span className="stat-label">Adquiridos</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon">⏳</span>
                        <span className="stat-value">
                          {totalProveedores - proveedoresAdquiridos}
                        </span>
                        <span className="stat-label">Pendientes</span>
                      </div>
                    </div>

                    <button className="btn-ver-detalles">
                      {estaProcesando ? "Procesando..." : "Ver detalles →"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Modal crear lista */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Crear Nuevo Evento</h2>
                <button className="btn-cerrar-modal" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nombre_lista">
                    Nombre del Evento <span className="required">*</span>
                  </label>
                  <input
                    id="nombre_lista"
                    type="text"
                    className={`form-input ${error ? "input-error" : ""}`}
                    placeholder="Ej: Mi Boda 2026"
                    value={nombreNuevaLista}
                    onChange={(e) => {
                      setNombreNuevaLista(e.target.value);
                      setError("");
                    }}
                    maxLength="100"
                  />
                  {error && <span className="error-message">⚠️ {error}</span>}
                  <small className="field-hint">{nombreNuevaLista.length}/100 caracteres</small>
                </div>

                <div className="form-group">
                  <label htmlFor="descripcion_lista">Descripción (opcional)</label>
                  <textarea
                    id="descripcion_lista"
                    className="form-input"
                    placeholder="Ej: Proveedores para mi boda en la playa"
                    value={descripcionNuevaLista}
                    onChange={(e) => setDescripcionNuevaLista(e.target.value)}
                    rows="3"
                    maxLength="500"
                  />
                  <small className="field-hint">{descripcionNuevaLista.length}/500 caracteres</small>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancelar" onClick={() => setShowModal(false)} disabled={creandoLista}>
                  Cancelar
                </button>
                <button
                  className="btn-crear"
                  onClick={crearLista}
                  disabled={creandoLista || !nombreNuevaLista.trim()}
                >
                  {creandoLista ? "Creando..." : "✓ Crear Evento"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal renombrar lista */}
        {showRenombrarModal && (
          <div className="modal-overlay" onClick={() => setShowRenombrarModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Renombrar Evento</h2>
                <button className="btn-cerrar-modal" onClick={() => setShowRenombrarModal(false)}>✕</button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="nuevo_nombre_lista">
                    Nombre del Evento <span className="required">*</span>
                  </label>
                  <input
                    id="nuevo_nombre_lista"
                    type="text"
                    className={`form-input ${errorRenombrar ? "input-error" : ""}`}
                    placeholder="Ej: Mi Boda 2026"
                    value={nuevoNombreLista}
                    onChange={(e) => {
                      setNuevoNombreLista(e.target.value);
                      setErrorRenombrar("");
                    }}
                    maxLength="100"
                  />
                  {errorRenombrar && <span className="error-message">⚠️ {errorRenombrar}</span>}
                  <small className="field-hint">{nuevoNombreLista.length}/100 caracteres</small>
                </div>

                <div className="form-group">
                  <label htmlFor="nueva_descripcion_lista">Descripción (opcional)</label>
                  <textarea
                    id="nueva_descripcion_lista"
                    className="form-input"
                    placeholder="Ej: Proveedores para mi boda en la playa"
                    value={nuevaDescripcionLista}
                    onChange={(e) => setNuevaDescripcionLista(e.target.value)}
                    rows="3"
                    maxLength="500"
                  />
                  <small className="field-hint">{nuevaDescripcionLista.length}/500 caracteres</small>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn-cancelar"
                  onClick={() => setShowRenombrarModal(false)}
                  disabled={renombrandoLista}
                >
                  Cancelar
                </button>
                <button
                  className="btn-crear"
                  onClick={renombrarLista}
                  disabled={renombrandoLista || !nuevoNombreLista.trim()}
                >
                  {renombrandoLista ? "Guardando..." : "✓ Guardar Cambios"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClienteLayout>
  );
}

export default MisListas;