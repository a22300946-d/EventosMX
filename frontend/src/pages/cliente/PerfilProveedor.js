import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import Layout from "../../components/Layout";
import api from "../../services/api";
import "./PerfilProveedor.css";

function PerfilProveedor() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados principales
  const [proveedor, setProveedor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("servicios");

  // Estados para modal de imagen
  const [imagenModalAbierta, setImagenModalAbierta] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);

  // Estados para modal de cotización
  const [modalCotizacionAbierto, setModalCotizacionAbierto] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [formularioSolicitud, setFormularioSolicitud] = useState({
    fecha_evento: "",
    numero_invitados: "",
    tipo_evento: "",
    presupuesto_estimado: "",
    descripcion_solicitud: "",
  });

  // Estados para calendario
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(new Date());

  // Constantes para el calendario
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const diasSemana = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  // Effect para cargar datos iniciales
  useEffect(() => {
    cargarDatosProveedor();
  }, [id]);

  // ========== FUNCIONES DE CARGA DE DATOS ==========

  const cargarDatosProveedor = async () => {
    try {
      setLoading(true);

      // Cargar datos del proveedor
      const responseProveedor = await api.get(`/proveedores/publico/${id}`);
      setProveedor(responseProveedor.data.data);

      // Cargar servicios
      try {
        const responseServicios = await api.get(`/servicios/buscar`, {
          params: {
            id_proveedor: id,
            limite: 100,
          },
        });

        const serviciosFiltrados = (responseServicios.data.data || []).filter(
          (servicio) => servicio.id_proveedor === parseInt(id),
        );
        setServicios(serviciosFiltrados);
      } catch (error) {
        setServicios([]);
      }

      // Cargar galería
      try {
        const responseGaleria = await api.get(`/galeria/proveedor/${id}`);
        setGaleria(responseGaleria.data.data || []);
      } catch (error) {
        setGaleria([]);
      }

      // Cargar promociones
      try {
        const responsePromociones = await api.get(
          `/promociones/proveedor/${id}`,
        );
        setPromociones(responsePromociones.data.data || []);
      } catch (error) {
        setPromociones([]);
      }

      // Cargar reseñas
      try {
        const responseResenas = await api.get(`/resenas/proveedor/${id}`);
        setResenas(responseResenas.data.data || []);
      } catch (error) {
        setResenas([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const cargarFechasBloqueadas = async (idProveedor) => {
    try {
      const hoy = new Date();
      const fechaInicio = hoy.toISOString().split("T")[0];

      // Obtener fechas para los próximos 12 meses
      const fechaFin = new Date();
      fechaFin.setMonth(fechaFin.getMonth() + 12);
      const fechaFinStr = fechaFin.toISOString().split("T")[0];
      const response = await api.get(
        `/calendario/proveedor/${idProveedor}/disponibilidad`,
        {
          params: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFinStr,
          },
        },
      );

      // Filtrar solo las fechas NO disponibles y normalizar formato
      const bloqueadas = response.data.data
        .filter((fecha) => {
          return fecha.disponible === false;
        })
        .map((fecha) => {
          // Normalizar formato: extraer solo YYYY-MM-DD
          let fechaStr = fecha.fecha;

          // Si viene como objeto Date o con timestamp, extraer solo la fecha
          if (typeof fechaStr === "string" && fechaStr.includes("T")) {
            fechaStr = fechaStr.split("T")[0];
          } else if (fechaStr instanceof Date) {
            fechaStr = fechaStr.toISOString().split("T")[0];
          }

          return fechaStr;
        });

      setFechasBloqueadas(bloqueadas);
    } catch (error) {
      setFechasBloqueadas([]);
    }
  };

  // ========== FUNCIONES DE CALENDARIO ==========

  const cambiarMesCalendario = (incremento) => {
    const nuevaFecha = new Date(mesCalendario);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + incremento);
    setMesCalendario(nuevaFecha);
  };

  const esFechaBloqueada = (fechaStr) => {
    return fechasBloqueadas.includes(fechaStr);
  };

  const esFechaPasada = (year, month, day) => {
    const fecha = new Date(year, month, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  const seleccionarFechaCalendario = (dia) => {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();

    // Verificar si es fecha pasada
    if (esFechaPasada(year, month, dia)) {
      return;
    }

    const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;

    // Verificar si está bloqueada
    if (esFechaBloqueada(fechaStr)) {
      alert(" Esta fecha no está disponible. Por favor selecciona otra fecha.");
      return;
    }

    setFormularioSolicitud((prev) => ({
      ...prev,
      fecha_evento: fechaStr,
    }));

    setMostrarCalendario(false);
  };

  const renderCalendario = () => {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();

    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    const diasMes = [];
    const primerDiaSemana =
      primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

    // Días vacíos antes del primer día
    for (let i = 0; i < primerDiaSemana; i++) {
      diasMes.push(
        <div key={`empty-${i}`} className="calendario-dia-modal vacio"></div>,
      );
    }

    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
      const bloqueado = esFechaBloqueada(fechaStr);
      const pasado = esFechaPasada(year, month, dia);
      const seleccionado = formularioSolicitud.fecha_evento === fechaStr;

      diasMes.push(
        <div
          key={dia}
          className={`calendario-dia-modal ${bloqueado ? "bloqueado" : ""} ${pasado ? "pasado" : ""} ${seleccionado ? "seleccionado" : ""}`}
          onClick={() =>
            !bloqueado && !pasado && seleccionarFechaCalendario(dia)
          }
        >
          {dia}
        </div>,
      );
    }

    return diasMes;
  };

  // ========== FUNCIONES DE MODAL DE COTIZACIÓN ==========

  const handleAbrirModalCotizacion = () => {
    setModalCotizacionAbierto(true);
    setServiciosSeleccionados([]);
    setFormularioSolicitud({
      fecha_evento: "",
      numero_invitados: "",
      tipo_evento: "",
      presupuesto_estimado: "",
      descripcion_solicitud: "",
    });

    if (id) {
      cargarFechasBloqueadas(id);
    }
  };

  const handleCerrarModalCotizacion = () => {
    setModalCotizacionAbierto(false);
    setServiciosSeleccionados([]);
    setFormularioSolicitud({
      fecha_evento: "",
      numero_invitados: "",
      tipo_evento: "",
      presupuesto_estimado: "",
      descripcion_solicitud: "",
    });
  };

  const handleToggleServicio = (idServicio) => {
    setServiciosSeleccionados((prev) => {
      if (prev.includes(idServicio)) {
        return prev.filter((id) => id !== idServicio);
      } else {
        return [...prev, idServicio];
      }
    });
  };

  const handleCambioFormulario = (e) => {
    const { name, value } = e.target;

    setFormularioSolicitud((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEnviarSolicitud = async () => {
    // Validar campos obligatorios
    if (!formularioSolicitud.fecha_evento || !formularioSolicitud.tipo_evento) {
      alert(
        " Por favor completa los campos obligatorios: Fecha del evento y Tipo de evento",
      );
      return;
    }

    // Validar que haya al menos un servicio seleccionado
    if (serviciosSeleccionados.length === 0) {
      alert(" Por favor selecciona al menos un servicio para tu evento");
      return;
    }

    // Validar que la fecha no esté bloqueada
    if (esFechaBloqueada(formularioSolicitud.fecha_evento)) {
      alert(
        " La fecha seleccionada no está disponible. Por favor elige otra fecha.",
      );
      return;
    }

    // Validar que la fecha sea futura
    const fechaEvento = new Date(formularioSolicitud.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaEvento < hoy) {
      alert(" La fecha del evento debe ser futura");
      return;
    }

    try {
      setEnviandoSolicitud(true);

      const datos = {
        id_proveedor: parseInt(id),
        fecha_evento: formularioSolicitud.fecha_evento,
        tipo_evento: formularioSolicitud.tipo_evento,
        numero_invitados: formularioSolicitud.numero_invitados
          ? parseInt(formularioSolicitud.numero_invitados)
          : null,
        presupuesto_estimado: formularioSolicitud.presupuesto_estimado
          ? parseFloat(formularioSolicitud.presupuesto_estimado)
          : null,
        descripcion_solicitud:
          formularioSolicitud.descripcion_solicitud || null,
        servicios_solicitados: serviciosSeleccionados,
      };

      await api.post("/solicitudes", datos);

      alert(
        " ¡Solicitud enviada exitosamente! El proveedor te responderá pronto.",
      );
      handleCerrarModalCotizacion();
    } catch (error) {
      console.error("Error al enviar solicitud:", error);

      if (error.response?.status === 401) {
        alert(" Debes iniciar sesión para solicitar una cotización");
        navigate("/login");
      } else if (error.response?.data?.message) {
        alert(` ${error.response.data.message}`);
      } else {
        alert(" Error al enviar la solicitud. Por favor, intenta nuevamente.");
      }
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // ========== FUNCIONES DE MODAL DE IMAGEN ==========

  const handleAbrirImagen = (imagen) => {
    setImagenSeleccionada(imagen);
    setImagenModalAbierta(true);
  };

  const handleCerrarImagen = () => {
    setImagenModalAbierta(false);
    setImagenSeleccionada(null);
  };

  // ========== FUNCIONES DE RENDERIZADO ==========

  const renderEstrellas = (calificacion) => {
    const estrellas = [];
    const calificacionEstrellas = parseFloat(calificacion || 0) * 5;

    for (let i = 1; i <= 5; i++) {
      if (calificacionEstrellas >= i) {
        estrellas.push(<FaStar key={i} className="estrella-llena" />);
      } else if (calificacionEstrellas >= i - 0.5) {
        estrellas.push(<FaStarHalfAlt key={i} className="estrella-media" />);
      } else {
        estrellas.push(<FaRegStar key={i} className="estrella-vacia" />);
      }
    }

    return estrellas;
  };

  const getBadge = (calificacion) => {
    const cal = parseFloat(calificacion || 0);

    if (cal >= 0.625) {
      return { class: "badge-positivo", text: "Reseña positiva" };
    } else if (cal <= 0.375) {
      return { class: "badge-negativo", text: "Reseña negativa" };
    }
    return { class: "badge-neutro", text: "Reseña neutra" };
  };

  // ========== RENDERIZADO CONDICIONAL ==========

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando información del proveedor...</p>
        </div>
      </Layout>
    );
  }

  if (!proveedor) {
    return (
      <Layout>
        <div className="error-container">
          <h2>Proveedor no encontrado</h2>
          <button onClick={() => navigate("/explorar")} className="btn-volver">
            Volver a la búsqueda
          </button>
        </div>
      </Layout>
    );
  }

  const calificacion = parseFloat(proveedor.calificacion_promedio) || 0;
  const calificacionDe5 = calificacion * 5;

  // ========== RENDERIZADO PRINCIPAL ==========

  return (
    <Layout>
      <div className="perfil-proveedor-container">
        {/* Header del perfil */}
        <div className="perfil-header">
          <div className="perfil-header-content">
            <div className="perfil-logo-container">
              <img
                src={proveedor.logo || "https://via.placeholder.com/200"}
                alt={proveedor.nombre_negocio}
                className="perfil-logo"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/200?text=Sin+Logo";
                }}
              />
            </div>

            <div className="perfil-info-principal">
              <div className="perfil-titulo">
                <h1>{proveedor.nombre_negocio}</h1>
                <button className="btn-favorito-grande">
                  <span className="icono-corazon">♡</span>
                </button>
              </div>

              <div className="perfil-rating">
                <div className="estrellas">{renderEstrellas(calificacion)}</div>
                <span className="rating-numero">
                  {calificacionDe5.toFixed(1)}/5
                </span>
                <span className="total-resenas">
                  ({resenas.length} reseñas)
                </span>
              </div>

              <div className="perfil-detalles">
                <div className="detalle-item">
                  <span className="icono">📍</span>
                  <span>{proveedor.ciudad}</span>
                </div>
                <div className="detalle-item">
                  <span className="icono">📋</span>
                  <span>{proveedor.tipo_servicio}</span>
                </div>
                {proveedor.telefono && (
                  <div className="detalle-item">
                    <span className="icono">📞</span>
                    <span>{proveedor.telefono}</span>
                  </div>
                )}
                {proveedor.correo && (
                  <div className="detalle-item">
                    <span className="icono">✉️</span>
                    <span>{proveedor.correo}</span>
                  </div>
                )}
              </div>

              <div className="perfil-acciones">
                <button
                  className="btn-solicitar-cotizacion"
                  onClick={handleAbrirModalCotizacion}
                >
                  Solicitar Cotización
                </button>
                <button className="btn-secundario">Enviar Mensaje</button>
              </div>
            </div>
          </div>
        </div>

        {/* Descripción */}
        {proveedor.descripcion && (
          <div className="perfil-seccion descripcion-seccion">
            <h2>Acerca de nosotros</h2>
            <p>{proveedor.descripcion}</p>
          </div>
        )}

        {/* Navegación de tabs */}
        <div className="tabs-navegacion">
          <button
            className={`tab-btn ${tabActiva === "servicios" ? "activa" : ""}`}
            onClick={() => setTabActiva("servicios")}
          >
            Servicios
          </button>
          <button
            className={`tab-btn ${tabActiva === "galeria" ? "activa" : ""}`}
            onClick={() => setTabActiva("galeria")}
          >
            Galería
          </button>
          <button
            className={`tab-btn ${tabActiva === "promociones" ? "activa" : ""}`}
            onClick={() => setTabActiva("promociones")}
          >
            Promociones
          </button>
          <button
            className={`tab-btn ${tabActiva === "resenas" ? "activa" : ""}`}
            onClick={() => setTabActiva("resenas")}
          >
            Reseñas ({resenas.length})
          </button>
        </div>

        {/* Contenido de las tabs */}
        <div className="tabs-contenido">
          {/* Tab Servicios */}
          {tabActiva === "servicios" && (
            <div className="tab-panel">
              <h2>Nuestros Servicios</h2>
              {servicios.length === 0 ? (
                <p className="mensaje-vacio">No hay servicios disponibles</p>
              ) : (
                <div className="servicios-grid">
                  {servicios.map((servicio) => (
                    <div key={servicio.id_servicio} className="servicio-card">
                      <div className="servicio-header">
                        <h3>{servicio.nombre_servicio}</h3>
                        <span className="servicio-precio">
                          ${parseFloat(servicio.precio).toLocaleString("es-MX")}
                        </span>
                      </div>
                      {servicio.descripcion && (
                        <p className="servicio-descripcion">
                          {servicio.descripcion}
                        </p>
                      )}
                      <button className="btn-ver-mas">Ver detalles</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Galería */}
          {tabActiva === "galeria" && (
            <div className="tab-panel">
              <h2>Galería de Fotos</h2>
              {galeria.length === 0 ? (
                <p className="mensaje-vacio">No hay fotos en la galería</p>
              ) : (
                <div className="galeria-grid">
                  {galeria.map((foto) => (
                    <div
                      key={foto.id_foto}
                      className="galeria-item"
                      onClick={() => handleAbrirImagen(foto.url_foto)}
                    >
                      <img
                        src={foto.url_foto}
                        alt={foto.titulo || "Foto de galería"}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/400?text=Error+al+cargar";
                        }}
                      />
                      {foto.titulo && (
                        <div className="galeria-overlay">
                          <span>{foto.titulo}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Promociones */}
          {tabActiva === "promociones" && (
            <div className="tab-panel">
              <h2>Promociones Especiales</h2>
              {promociones.length === 0 ? (
                <p className="mensaje-vacio">No hay promociones activas</p>
              ) : (
                <div className="promociones-grid">
                  {promociones.map((promo) => (
                    <div key={promo.id_promocion} className="promocion-card">
                      <div className="promocion-badge">🎉 OFERTA</div>
                      <h3>{promo.titulo}</h3>
                      <p className="promocion-descripcion">
                        {promo.descripcion}
                      </p>
                      <div className="promocion-precio">
                        <span className="precio-original">
                          $
                          {parseFloat(
                            promo.precio_original || 0,
                          ).toLocaleString("es-MX")}
                        </span>
                        <span className="precio-promocional">
                          $
                          {parseFloat(promo.precio_promocional).toLocaleString(
                            "es-MX",
                          )}
                        </span>
                      </div>
                      <div className="promocion-vigencia">
                        <span>
                          Válida hasta:{" "}
                          {new Date(promo.fecha_fin).toLocaleDateString(
                            "es-MX",
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Reseñas */}
          {tabActiva === "resenas" && (
            <div className="tab-panel">
              <h2>Opiniones de Clientes</h2>
              {resenas.length === 0 ? (
                <p className="mensaje-vacio">
                  Aún no hay reseñas para este proveedor
                </p>
              ) : (
                <div className="resenas-lista">
                  {resenas.map((resena) => {
                    const badge = getBadge(resena.calificacion);
                    return (
                      <div key={resena.id_resena} className="resena-card">
                        <div className="resena-header">
                          <div className="resena-usuario">
                            <div className="avatar-cliente">
                              {resena.cliente_foto ? (
                                <img
                                  src={resena.cliente_foto}
                                  alt={resena.cliente_nombre}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="avatar-inicial"
                                style={{
                                  display: resena.cliente_foto
                                    ? "none"
                                    : "flex",
                                }}
                              >
                                {(resena.cliente_nombre || "C")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            </div>
                            <div className="resena-info">
                              <h3>
                                {resena.cliente_nombre || "Cliente Anónimo"}
                              </h3>
                              <div className="estrellas">
                                {renderEstrellas(resena.calificacion)}
                              </div>
                              <p className="resena-fecha">
                                {new Date(
                                  resena.fecha_resena ||
                                    resena.fecha_publicacion,
                                ).toLocaleDateString("es-MX", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={`badge ${badge.class}`}>
                            {badge.text}
                          </span>
                        </div>

                        <p className="resena-comentario">{resena.comentario}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de imagen */}
      {imagenModalAbierta && (
        <div className="modal-overlay" onClick={handleCerrarImagen}>
          <div className="modal-imagen-container">
            <button className="modal-cerrar" onClick={handleCerrarImagen}>
              ✕
            </button>
            <img src={imagenSeleccionada} alt="Imagen ampliada" />
          </div>
        </div>
      )}

      {/* Modal de Solicitar Cotización */}
      {modalCotizacionAbierto && (
        <div className="modal-overlay" onClick={handleCerrarModalCotizacion}>
          <div
            className="modal-cotizacion"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2> Solicitar Cotización</h2>
              <button
                className="btn-cerrar-modal"
                onClick={handleCerrarModalCotizacion}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-descripcion">
                Completa los detalles de tu evento y {proveedor?.nombre_negocio}{" "}
                te enviará una cotización personalizada.
              </p>

              {/* Campo de Fecha con Calendario */}
              <div className="form-group">
                <label htmlFor="fecha_evento">
                  Fecha del Evento <span className="campo-obligatorio">*</span>
                </label>

                <div className="fecha-input-container">
                  <input
                    type="text"
                    id="fecha_evento"
                    name="fecha_evento"
                    value={
                      formularioSolicitud.fecha_evento
                        ? new Date(
                            formularioSolicitud.fecha_evento + "T00:00:00",
                          ).toLocaleDateString("es-MX", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : ""
                    }
                    readOnly
                    placeholder="Selecciona una fecha del calendario"
                    className="form-control fecha-readonly"
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                  />
                  <button
                    type="button"
                    className="btn-calendario-toggle"
                    onClick={() => setMostrarCalendario(!mostrarCalendario)}
                  >
                    📅
                  </button>
                </div>

                {mostrarCalendario && (
                  <div className="calendario-modal-container">
                    <div className="calendario-card-modal">
                      <div className="calendario-header-modal">
                        <button
                          type="button"
                          onClick={() => cambiarMesCalendario(-1)}
                          className="btn-mes-modal"
                        >
                          &lt;
                        </button>
                        <h3>
                          {meses[mesCalendario.getMonth()]}{" "}
                          {mesCalendario.getFullYear()}
                        </h3>
                        <button
                          type="button"
                          onClick={() => cambiarMesCalendario(1)}
                          className="btn-mes-modal"
                        >
                          &gt;
                        </button>
                      </div>

                      <div className="calendario-semana-modal">
                        {diasSemana.map((dia) => (
                          <div
                            key={dia}
                            className="calendario-dia-semana-modal"
                          >
                            {dia}
                          </div>
                        ))}
                      </div>

                      <div className="calendario-grid-modal">
                        {renderCalendario()}
                      </div>

                      <div className="calendario-leyenda">
                        <div className="leyenda-item">
                          <div className="leyenda-color disponible"></div>
                          <span>Disponible</span>
                        </div>
                        <div className="leyenda-item">
                          <div className="leyenda-color bloqueado"></div>
                          <span>No disponible</span>
                        </div>
                        <div className="leyenda-item">
                          <div className="leyenda-color seleccionado"></div>
                          <span>Seleccionado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tipo de Evento */}
              <div className="form-group">
                <label htmlFor="tipo_evento">
                  Tipo de Evento <span className="campo-obligatorio">*</span>
                </label>
                <select
                  id="tipo_evento"
                  name="tipo_evento"
                  value={formularioSolicitud.tipo_evento}
                  onChange={handleCambioFormulario}
                  className="form-control"
                  required
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="Boda">Boda</option>
                  <option value="Cumpleaños">Cumpleaños</option>
                  <option value="Graduación">Graduación</option>
                  <option value="Conferencia">Conferencia</option>
                  <option value="Reunión Empresarial">
                    Reunión Empresarial
                  </option>
                  <option value="Aniversario">Aniversario</option>
                  <option value="Fiesta Infantil">Fiesta Infantil</option>
                  <option value="XV Años">XV Años</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Checklist de Servicios */}
              <div className="form-group">
                <label>
                  Servicios que Necesitas{" "}
                  <span className="campo-obligatorio">*</span>
                </label>
                <div className="servicios-checklist">
                  {servicios.length === 0 ? (
                    <p className="no-servicios">
                      Este proveedor aún no tiene servicios registrados.
                    </p>
                  ) : (
                    servicios.map((servicio) => (
                      <label
                        key={servicio.id_servicio}
                        className="servicio-item"
                      >
                        <input
                          type="checkbox"
                          checked={serviciosSeleccionados.includes(
                            servicio.id_servicio,
                          )}
                          onChange={() =>
                            handleToggleServicio(servicio.id_servicio)
                          }
                        />
                        <div className="servicio-info">
                          <span className="servicio-nombre">
                            {servicio.nombre_servicio}
                          </span>
                          <span className="servicio-precio">
                            $
                            {parseFloat(servicio.precio || 0).toLocaleString(
                              "es-MX",
                            )}
                            {servicio.tipo_precio &&
                              ` / ${servicio.tipo_precio}`}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                {serviciosSeleccionados.length > 0 && (
                  <p className="servicios-seleccionados-count">
                    {serviciosSeleccionados.length} servicio
                    {serviciosSeleccionados.length !== 1 ? "s" : ""}{" "}
                    seleccionado{serviciosSeleccionados.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              {/* Número de Invitados y Presupuesto */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numero_invitados">Número de Invitados</label>
                  <input
                    type="number"
                    id="numero_invitados"
                    name="numero_invitados"
                    value={formularioSolicitud.numero_invitados}
                    onChange={handleCambioFormulario}
                    min="1"
                    placeholder="Ej: 100"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="presupuesto_estimado">
                    Presupuesto Estimado
                  </label>
                  <input
                    type="number"
                    id="presupuesto_estimado"
                    name="presupuesto_estimado"
                    value={formularioSolicitud.presupuesto_estimado}
                    onChange={handleCambioFormulario}
                    min="0"
                    step="0.01"
                    placeholder="Ej: 50000"
                    className="form-control"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label htmlFor="descripcion_solicitud">
                  Descripción del Evento
                </label>
                <textarea
                  id="descripcion_solicitud"
                  name="descripcion_solicitud"
                  value={formularioSolicitud.descripcion_solicitud}
                  onChange={handleCambioFormulario}
                  rows="4"
                  placeholder="Cuéntanos más detalles sobre tu evento..."
                  className="form-control"
                />
              </div>

              <p className="campos-obligatorios-nota">
                <span className="campo-obligatorio">*</span> Campos obligatorios
              </p>
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancelar"
                onClick={handleCerrarModalCotizacion}
                disabled={enviandoSolicitud}
              >
                Cancelar
              </button>
              <button
                className="btn-enviar-solicitud"
                onClick={handleEnviarSolicitud}
                disabled={enviandoSolicitud}
              >
                {enviandoSolicitud ? "Enviando..." : " Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default PerfilProveedor;
