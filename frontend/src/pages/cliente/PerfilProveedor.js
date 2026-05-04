import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { clienteService } from "../../services/clienteService";
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

  // Estados para tipos de eventos
  const [eventosProveedor, setEventosProveedor] = useState([]);

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

  // Estados para listas
  const [mostrarModalListas, setMostrarModalListas] = useState(false);
  const [listasDisponibles, setListasDisponibles] = useState([]);
  const [listaSeleccionada, setListaSeleccionada] = useState("");
  const [agregandoALista, setAgregandoALista] = useState(false);

  // Estados para favoritos
  const [esFavorito, setEsFavorito] = useState(false);
  const [idFavorito, setIdFavorito] = useState(null);
  const [procesandoFavorito, setProcesandoFavorito] = useState(false);

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
    verificarSiEsFavorito();
  }, [id]);

  // ========== FUNCIONES DE CARGA DE DATOS ==========

  const cargarDatosProveedor = async () => {
    try {
      setLoading(true);

      // Cargar datos del proveedor
      const responseProveedor = await api.get(`/proveedores/publico/${id}`);
      setProveedor(responseProveedor.data.data);

      // Cargar tipos de eventos del proveedor
      try {
        const responseEventos = await api.get(`/proveedor-eventos/proveedor/${id}/eventos`);
        setEventosProveedor(responseEventos.data.data || []);
      } catch (error) {
        console.error("Error al cargar eventos:", error);
        setEventosProveedor([]);
      }

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
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFechasBloqueadas = async (idProveedor) => {
    try {
      const hoy = new Date();
      const fechaInicio = hoy.toISOString().split("T")[0];

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

      const bloqueadas = response.data.data
        .filter((fecha) => fecha.disponible === false)
        .map((fecha) => {
          let fechaStr = fecha.fecha;
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

  // ========== FUNCIONES DE FAVORITOS ==========

  const verificarSiEsFavorito = async () => {
    try {
      const response = await clienteService.verificarSiEsFavorito(id);

      if (response.data.data.es_favorito) {
        setEsFavorito(true);
        setIdFavorito(response.data.data.id_lista_proveedor);
      } else {
        setEsFavorito(false);
        setIdFavorito(null);
      }
    } catch (error) {
      console.log("No se pudo verificar favoritos");
    }
  };

  const toggleFavorito = async () => {
    try {
      setProcesandoFavorito(true);

      if (esFavorito) {
        await clienteService.eliminarDeFavoritos(idFavorito);
        setEsFavorito(false);
        setIdFavorito(null);
      } else {
        const response = await clienteService.agregarAFavoritos(parseInt(id));
        setEsFavorito(true);
        setIdFavorito(response.data.data.id_lista_proveedor);
      }
    } catch (error) {
      console.error("Error al gestionar favorito:", error);
      if (error.response?.status === 401) {
        alert("⚠️ Debes iniciar sesión para guardar favoritos");
        navigate("/login");
      } else {
        alert("❌ Error al actualizar favoritos");
      }
    } finally {
      setProcesandoFavorito(false);
    }
  };

  // ========== FUNCIONES DE LISTAS ==========

  const cargarListasCliente = async () => {
    try {
      const response = await clienteService.obtenerMisListas();
      setListasDisponibles(response.data.data || []);
      setMostrarModalListas(true);
    } catch (error) {
      console.error("Error al cargar listas:", error);
      if (error.response?.status === 401) {
        alert("⚠️ Debes iniciar sesión para agregar a listas");
        navigate("/login");
      } else {
        alert("❌ Error al cargar tus listas");
      }
    }
  };

  const agregarALista = async () => {
    if (!listaSeleccionada) {
      alert("⚠️ Selecciona una lista");
      return;
    }

    try {
      setAgregandoALista(true);

      await clienteService.agregarProveedorALista(
        parseInt(listaSeleccionada),
        parseInt(proveedor.id_proveedor)
      );

      alert("✅ Proveedor agregado a la lista");
      setMostrarModalListas(false);
      setListaSeleccionada("");
    } catch (error) {
      console.error("Error al agregar a lista:", error);

      if (error.response?.status === 409) {
        alert("⚠️ Este proveedor ya está en esa lista");
      } else if (error.response?.status === 401) {
        alert("⚠️ Debes iniciar sesión para agregar a listas");
        navigate("/login");
      } else if (error.response?.status === 400) {
        alert(`⚠️ ${error.response.data.message || 'Datos inválidos'}`);
      } else {
        alert("❌ Error al agregar a la lista");
      }
    } finally {
      setAgregandoALista(false);
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

    if (esFechaPasada(year, month, dia)) {
      return;
    }

    const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;

    if (esFechaBloqueada(fechaStr)) {
      alert(
        "⚠️ Esta fecha no está disponible. Por favor selecciona otra fecha.",
      );
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

    for (let i = 0; i < primerDiaSemana; i++) {
      diasMes.push(
        <div key={`empty-${i}`} className="calendario-dia-modal vacio"></div>,
      );
    }

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
    if (!formularioSolicitud.fecha_evento || !formularioSolicitud.tipo_evento) {
      alert(
        "⚠️ Por favor completa los campos obligatorios: Fecha del evento y Tipo de evento",
      );
      return;
    }

    if (serviciosSeleccionados.length === 0) {
      alert("⚠️ Por favor selecciona al menos un servicio para tu evento");
      return;
    }

    if (esFechaBloqueada(formularioSolicitud.fecha_evento)) {
      alert(
        "⚠️ La fecha seleccionada no está disponible. Por favor elige otra fecha.",
      );
      return;
    }

    const fechaEvento = new Date(formularioSolicitud.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaEvento < hoy) {
      alert("⚠️ La fecha del evento debe ser futura");
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
        "✅ ¡Solicitud enviada exitosamente! El proveedor te responderá pronto.",
      );
      handleCerrarModalCotizacion();
    } catch (error) {
      console.error("Error al enviar solicitud:", error);

      if (error.response?.status === 401) {
        alert("⚠️ Debes iniciar sesión para solicitar una cotización");
        navigate("/login");
      } else if (error.response?.data?.message) {
        alert(`❌ ${error.response.data.message}`);
      } else {
        alert(
          "❌ Error al enviar la solicitud. Por favor, intenta nuevamente.",
        );
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
                <button
                  className={`btn-favorito-grande ${esFavorito ? "favorito-activo" : ""}`}
                  onClick={toggleFavorito}
                  disabled={procesandoFavorito}
                  title={
                    esFavorito ? "Quitar de favoritos" : "Agregar a favoritos"
                  }
                >
                  <span className="icono-corazon">
                    {esFavorito ? "♥" : "♡"}
                  </span>
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
                <button
                  className="btn-agregar-lista"
                  onClick={cargarListasCliente}
                >
                  + Agregar a lista
                </button>
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

        {/* SECCIÓN DE TIPOS DE EVENTOS - MOVIDA AQUÍ */}
        {eventosProveedor.length > 0 && (
          <div className="perfil-seccion eventos-seccion">
            <h2>Tipos de eventos que atendemos</h2>
            <div className="eventos-tags-container">
              {eventosProveedor.map((evento) => (
                <span key={evento.id_tipo_evento} className="evento-tag-perfil">
                  <span className="evento-icono-perfil">{evento.icono}</span>
                  <span className="evento-nombre-perfil">{evento.nombre_evento}</span>
                </span>
              ))}
            </div>
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

      {/* Modales (sin cambios) */}
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

      {modalCotizacionAbierto && (
        <div className="modal-overlay" onClick={handleCerrarModalCotizacion}>
          <div
            className="modal-cotizacion"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ... resto del modal de cotización (sin cambios) ... */}
          </div>
        </div>
      )}

      {mostrarModalListas && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarModalListas(false)}
        >
          <div className="modal-listas" onClick={(e) => e.stopPropagation()}>
            {/* ... resto del modal de listas (sin cambios) ... */}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default PerfilProveedor;