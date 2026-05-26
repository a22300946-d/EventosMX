import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaSmile,
  FaMeh,
  FaFrown,
  FaThumbsUp,
  FaSortAmountDown,
  FaFilter,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import api from "../../services/api";
import { clienteService } from "../../services/clienteService";
import "./PerfilProveedor.css";

import {
  FiMapPin,
  FiClipboard,
  FiPhone,
  FiMail,
  FiHeart,
  FiX,
  FiCalendar,
  FiList,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
} from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { MdOutlineStorefront, MdStorefront } from "react-icons/md";
import { BsTag, BsFileText } from "react-icons/bs";

/* ─────────────────────────────────────────────────────────
   HOOK: useModal  — reemplaza alert() / confirm()
───────────────────────────────────────────────────────── */
function useModal() {
  const [modal, setModal] = useState(null);

  const closeModal = useCallback(() => setModal(null), []);

  const showModal = useCallback(
    ({ type = "info", title, message, okText }) => {
      return new Promise((resolve) => {
        setModal({
          type,
          title,
          message,
          okText,
          confirm: false,
          onClose: () => {
            closeModal();
            resolve();
          },
        });
      });
    },
    [closeModal],
  );

  const showConfirm = useCallback(
    ({ type = "warning", title, message, confirmText, cancelText }) => {
      return new Promise((resolve) => {
        setModal({
          type,
          title,
          message,
          confirmText,
          cancelText,
          confirm: true,
          onConfirm: () => {
            closeModal();
            resolve(true);
          },
          onCancel: () => {
            closeModal();
            resolve(false);
          },
        });
      });
    },
    [closeModal],
  );

  return { modal, closeModal, showModal, showConfirm };
}

/* ─────────────────────────────────────────────────────────
   COMPONENTE: AppModal
───────────────────────────────────────────────────────── */
function AppModal({ modal, onClose }) {
  if (!modal) return null;

  const config = {
    success: { icon: <FiCheckCircle />, bg: "#EAF3DE", color: "#3B6D11" },
    error: { icon: <FiAlertCircle />, bg: "#FCEBEB", color: "#A32D2D" },
    warning: { icon: <FiAlertTriangle />, bg: "#FAEEDA", color: "#854F0B" },
    info: { icon: <FiInfo />, bg: "#E6F1FB", color: "#185FA5" },
  };
  const { icon, bg, color } = config[modal.type] || config.info;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (modal.confirm) modal.onCancel?.();
      else modal.onClose?.();
      onClose();
    }
  };

  const handleConfirm = () => {
    modal.onConfirm?.();
    onClose();
  };
  const handleCancel = () => {
    modal.onCancel?.();
    onClose();
  };
  const handleOk = () => {
    modal.onClose?.();
    onClose();
  };

  return (
    <div
      className="app-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="app-modal-box">
        <div className="app-modal-icon" style={{ background: bg, color }}>
          {icon}
        </div>
        <div className="app-modal-content">
          {modal.title && <h3 className="app-modal-title">{modal.title}</h3>}
          {modal.message && (
            <p className="app-modal-message">{modal.message}</p>
          )}
        </div>
        <div className="app-modal-actions">
          {modal.confirm ? (
            <>
              <button
                className="app-modal-btn app-modal-btn--secondary"
                onClick={handleCancel}
              >
                {modal.cancelText || "Cancelar"}
              </button>
              <button
                className="app-modal-btn app-modal-btn--primary"
                onClick={handleConfirm}
              >
                {modal.confirmText || "Confirmar"}
              </button>
            </>
          ) : (
            <button
              className="app-modal-btn app-modal-btn--primary"
              onClick={handleOk}
            >
              {modal.okText || "Aceptar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL: PerfilProveedor
───────────────────────────────────────────────────────── */
function PerfilProveedor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { modal, closeModal, showModal, showConfirm } = useModal();

  const [proveedor, setProveedor] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState("servicios");
  const [filtroSentimiento, setFiltroSentimiento] = useState("todos");
  const [ordenResenas, setOrdenResenas] = useState("recientes");
  const [eventosProveedor, setEventosProveedor] = useState([]);
  const [imagenModalAbierta, setImagenModalAbierta] = useState(false);
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
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
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(new Date());
  const [mostrarModalListas, setMostrarModalListas] = useState(false);
  const [listasDisponibles, setListasDisponibles] = useState([]);
  const [listaSeleccionada, setListaSeleccionada] = useState("");
  const [agregandoALista, setAgregandoALista] = useState(false);
  const [esFavorito, setEsFavorito] = useState(false);
  const [idFavorito, setIdFavorito] = useState(null);
  const [procesandoFavorito, setProcesandoFavorito] = useState(false);

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

  useEffect(() => {
    cargarDatosProveedor();
    verificarSiEsFavorito();
  }, [id]);

  const obtenerSentimiento = (calificacion) => {
    const cal = parseFloat(calificacion || 0);
    if (cal >= 0.625) return "positivo";
    if (cal <= 0.375) return "negativo";
    return "neutro";
  };

  const obtenerResenasFiltradas = () => {
    let resenasFiltradas = [...resenas];
    if (filtroSentimiento !== "todos") {
      resenasFiltradas = resenasFiltradas.filter(
        (resena) =>
          obtenerSentimiento(resena.calificacion) === filtroSentimiento,
      );
    }
    if (ordenResenas === "mejores") {
      resenasFiltradas.sort(
        (a, b) =>
          parseFloat(b.calificacion || 0) - parseFloat(a.calificacion || 0),
      );
    } else if (ordenResenas === "peores") {
      resenasFiltradas.sort(
        (a, b) =>
          parseFloat(a.calificacion || 0) - parseFloat(b.calificacion || 0),
      );
    } else {
      resenasFiltradas.sort((a, b) => {
        const fechaA = new Date(a.fecha_resena || a.fecha_publicacion);
        const fechaB = new Date(b.fecha_resena || b.fecha_publicacion);
        return fechaB - fechaA;
      });
    }
    return resenasFiltradas;
  };

  const contarPorSentimiento = (sentimiento) => {
    if (sentimiento === "todos") return resenas.length;
    return resenas.filter(
      (r) => obtenerSentimiento(r.calificacion) === sentimiento,
    ).length;
  };

  const cargarDatosProveedor = async () => {
    try {
      setLoading(true);
      const responseProveedor = await api.get(`/proveedores/publico/${id}`);
      setProveedor(responseProveedor.data.data);
      try {
        const responseEventos = await api.get(
          `/proveedor-eventos/proveedor/${id}/eventos`,
        );
        setEventosProveedor(responseEventos.data.data || []);
      } catch (error) {
        setEventosProveedor([]);
      }
      try {
        const responseServicios = await api.get(`/servicios/buscar`, {
          params: { id_proveedor: id, limite: 100 },
        });
        const serviciosFiltrados = (responseServicios.data.data || []).filter(
          (servicio) => servicio.id_proveedor === parseInt(id),
        );
        setServicios(serviciosFiltrados);
      } catch (error) {
        setServicios([]);
      }
      try {
        const responseGaleria = await api.get(`/galeria/proveedor/${id}`);
        setGaleria(responseGaleria.data.data || []);
      } catch (error) {
        setGaleria([]);
      }
      try {
        const responsePromociones = await api.get(
          `/promociones/proveedor/${id}`,
        );
        setPromociones(responsePromociones.data.data || []);
      } catch (error) {
        setPromociones([]);
      }
      try {
        const responseResenas = await api.get(`/resenas/proveedor/${id}`);
        setResenas(responseResenas.data.data || []);
      } catch (error) {
        setResenas([]);
      }
    } catch (error) {
      console.error("Error al cargar datos del proveedor:", error);
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
        { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFinStr } },
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
        await showModal({
          type: "warning",
          title: "Sesión requerida",
          message: "Debes iniciar sesión para guardar favoritos.",
        });
        navigate("/login");
      } else {
        await showModal({
          type: "error",
          title: "Error",
          message: "No se pudo actualizar favoritos. Intenta de nuevo.",
        });
      }
    } finally {
      setProcesandoFavorito(false);
    }
  };

  const cargarListasCliente = async () => {
    try {
      const response = await clienteService.obtenerMisListas(id);
      setListasDisponibles(response.data.data || []);
      setMostrarModalListas(true);
    } catch (error) {
      if (error.response?.status === 401) {
        await showModal({
          type: "warning",
          title: "Sesión requerida",
          message: "Debes iniciar sesión para agregar a listas.",
        });
        navigate("/login");
      } else {
        await showModal({
          type: "error",
          title: "Error",
          message: "No se pudieron cargar tus listas. Intenta de nuevo.",
        });
      }
    }
  };

  const agregarALista = async () => {
    if (!listaSeleccionada) {
      await showModal({
        type: "warning",
        title: "Selecciona una lista",
        message: "Por favor elige una lista antes de continuar.",
      });
      return;
    }
    try {
      setAgregandoALista(true);
      await clienteService.agregarProveedorALista(
        parseInt(listaSeleccionada),
        parseInt(proveedor.id_proveedor),
      );
      await showModal({
        type: "success",
        title: "¡Listo!",
        message: "El proveedor fue agregado a tu lista correctamente.",
      });
      setMostrarModalListas(false);
      setListaSeleccionada("");
    } catch (error) {
      if (error.response?.status === 409) {
        await showModal({
          type: "info",
          title: "Ya está en la lista",
          message: "Este proveedor ya se encuentra en la lista seleccionada.",
        });
      } else if (error.response?.status === 401) {
        await showModal({
          type: "warning",
          title: "Sesión requerida",
          message: "Debes iniciar sesión para agregar a listas.",
        });
        navigate("/login");
      } else if (error.response?.status === 400) {
        await showModal({
          type: "error",
          title: "Datos inválidos",
          message:
            error.response.data.message ||
            "Revisa los datos e intenta de nuevo.",
        });
      } else {
        await showModal({
          type: "error",
          title: "Error",
          message: "No se pudo agregar a la lista. Intenta de nuevo.",
        });
      }
    } finally {
      setAgregandoALista(false);
    }
  };

  const cambiarMesCalendario = (incremento) => {
    const nuevaFecha = new Date(mesCalendario);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + incremento);
    setMesCalendario(nuevaFecha);
  };

  const esFechaBloqueada = (fechaStr) => fechasBloqueadas.includes(fechaStr);

  const esFechaPasada = (year, month, day) => {
    const fecha = new Date(year, month, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  const seleccionarFechaCalendario = async (dia) => {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();
    if (esFechaPasada(year, month, dia)) return;
    const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
    if (esFechaBloqueada(fechaStr)) {
      await showModal({
        type: "warning",
        title: "Fecha no disponible",
        message:
          "Esta fecha no está disponible. Por favor selecciona otra fecha.",
      });
      return;
    }
    setFormularioSolicitud((prev) => ({ ...prev, fecha_evento: fechaStr }));
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
    if (id) cargarFechasBloqueadas(id);
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
    setServiciosSeleccionados((prev) =>
      prev.includes(idServicio)
        ? prev.filter((id) => id !== idServicio)
        : [...prev, idServicio],
    );
  };

  const handleCambioFormulario = (e) => {
    const { name, value } = e.target;
    setFormularioSolicitud((prev) => ({ ...prev, [name]: value }));
  };

  const handleEnviarSolicitud = async () => {
    if (!formularioSolicitud.fecha_evento || !formularioSolicitud.tipo_evento) {
      await showModal({
        type: "warning",
        title: "Campos obligatorios",
        message:
          "Por favor completa la Fecha del evento y el Tipo de evento antes de continuar.",
      });
      return;
    }
    if (serviciosSeleccionados.length === 0) {
      await showModal({
        type: "warning",
        title: "Selecciona un servicio",
        message: "Por favor selecciona al menos un servicio para tu evento.",
      });
      return;
    }
    if (esFechaBloqueada(formularioSolicitud.fecha_evento)) {
      await showModal({
        type: "error",
        title: "Fecha no disponible",
        message:
          "La fecha seleccionada no está disponible. Por favor elige otra fecha.",
      });
      return;
    }
    const fechaEvento = new Date(formularioSolicitud.fecha_evento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaEvento < hoy) {
      await showModal({
        type: "warning",
        title: "Fecha inválida",
        message: "La fecha del evento debe ser en el futuro.",
      });
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
      const response = await api.post("/solicitudes", datos);
      const nuevaSolicitud = response.data.data;
      const id_solicitud = nuevaSolicitud.id_solicitud;
      handleCerrarModalCotizacion();
      await showModal({
        type: "success",
        title: "¡Solicitud enviada!",
        message:
          "Tu solicitud fue enviada exitosamente. Ahora puedes chatear con el proveedor.",
      });
      navigate(`/chat/${id_solicitud}`);
    } catch (error) {
      if (error.response?.status === 401) {
        await showModal({
          type: "warning",
          title: "Sesión requerida",
          message: "Debes iniciar sesión para solicitar una cotización.",
        });
        navigate("/login");
      } else if (error.response?.data?.message) {
        await showModal({
          type: "error",
          title: "Error al enviar",
          message: error.response.data.message,
        });
      } else {
        await showModal({
          type: "error",
          title: "Error",
          message:
            "No se pudo enviar la solicitud. Por favor, intenta nuevamente.",
        });
      }
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  const handleAbrirImagen = (imagen) => {
    setImagenSeleccionada(imagen);
    setImagenModalAbierta(true);
  };

  const handleCerrarImagen = () => {
    setImagenModalAbierta(false);
    setImagenSeleccionada(null);
  };

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
    if (cal >= 0.625)
      return {
        class: "sr-badge-aceptada",
        text: "Reseña positiva",
        icono: <FaSmile />,
      };
    if (cal <= 0.375)
      return {
        class: "sr-badge-rechazada",
        text: "Reseña negativa",
        icono: <FaFrown />,
      };
    return {
      class: "sr-badge-pendiente",
      text: "Reseña neutra",
      icono: <FaMeh />,
    };
  };

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
  const resenasMostradas = obtenerResenasFiltradas();

  return (
    <Layout>
      {/* ── Modal de notificaciones (reemplaza alert/confirm del navegador) ── */}
      <AppModal modal={modal} onClose={closeModal} />

      <div className="perfil-proveedor-container">
        {/* Header del perfil */}
        <div className="perfil-header">
          <div className="perfil-header-content">
            <div className="perfil-logo-container">
              {proveedor.logo ? (
                <img
                  src={proveedor.logo}
                  alt={proveedor.nombre_negocio}
                  className="perfil-logo"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                className="perfil-logo-fallback"
                style={{ display: proveedor.logo ? "none" : "flex" }}
              >
                <MdStorefront size={80} />
              </div>
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
                    {esFavorito ? <AiFillHeart /> : <FiHeart />}
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
                  <span className="icono">
                    <FiMapPin />
                  </span>
                  <span>{proveedor.ciudad}</span>
                </div>
                <div className="detalle-item">
                  <span className="icono">
                    <FiClipboard />
                  </span>
                  <span>{proveedor.tipo_servicio}</span>
                </div>
                {proveedor.telefono && (
                  <div className="detalle-item">
                    <span className="icono">
                      <FiPhone />
                    </span>
                    <span>{proveedor.telefono}</span>
                  </div>
                )}
                {proveedor.correo && (
                  <div className="detalle-item">
                    <span className="icono">
                      <FiMail />
                    </span>
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

        {/* Tipos de eventos */}
        {eventosProveedor.length > 0 && (
          <div className="perfil-seccion eventos-seccion">
            <h2>Tipos de eventos que atendemos</h2>
            <div className="eventos-tags-container">
              {eventosProveedor.map((evento) => (
                <span key={evento.id_tipo_evento} className="evento-tag-perfil">
                  <span className="evento-icono-perfil">{evento.icono}</span>
                  <span className="evento-nombre-perfil">
                    {evento.nombre_evento}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
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
                      <div className="servicio-card-top">
                        <div className="servicio-icono-wrapper">
                          <MdOutlineStorefront size={28} />
                        </div>
                        <span className="servicio-precio-badge">
                          ${parseFloat(servicio.precio).toLocaleString("es-MX")}
                          {servicio.tipo_precio && (
                            <span className="servicio-tipo-precio">
                              {" "}
                              / {servicio.tipo_precio}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="servicio-card-body">
                        <h3>{servicio.nombre_servicio}</h3>
                        {servicio.descripcion && (
                          <p className="servicio-descripcion">
                            {servicio.descripcion}
                          </p>
                        )}
                      </div>
                      {servicio.duracion && (
                        <div className="servicio-card-footer">
                          <span className="servicio-duracion">
                            <FiClock size={14} /> {servicio.duracion}
                          </span>
                        </div>
                      )}
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
                      onClick={() => handleAbrirImagen(foto)}
                    >
                      <img
                        src={foto.url_foto}
                        alt={foto.titulo || "Foto de galería"}
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/400?text=Error+al+cargar";
                        }}
                      />
                      <div className="galeria-overlay">
                        {foto.titulo && (
                          <span className="galeria-titulo">{foto.titulo}</span>
                        )}
                        {foto.descripcion && (
                          <span className="galeria-descripcion">
                            {foto.descripcion}
                          </span>
                        )}
                        {foto.fecha_subida && (
                          <span className="galeria-fecha">
                            <FiCalendar size={12} />
                            {new Date(foto.fecha_subida).toLocaleDateString(
                              "es-MX",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        )}
                      </div>
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
                      <div className="promocion-badge">
                        <BsTag /> OFERTA
                      </div>
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
              <div className="resenas-header-section">
                <h2>Opiniones de Clientes</h2>

                {resenas.length > 0 && (
                  <div className="sr-controles">
                    <div className="sr-filtros">
                      <FaFilter className="sr-ctrl-icon" />
                      <button
                        className={`sr-pill ${filtroSentimiento === "todos" ? "sr-pill-activo" : ""}`}
                        onClick={() => setFiltroSentimiento("todos")}
                      >
                        <FaThumbsUp /> Todas ({contarPorSentimiento("todos")})
                      </button>
                      <button
                        className={`sr-pill ${filtroSentimiento === "positivo" ? "sr-pill-activo" : ""}`}
                        onClick={() => setFiltroSentimiento("positivo")}
                      >
                        <FaSmile /> Positivas (
                        {contarPorSentimiento("positivo")})
                      </button>
                      <button
                        className={`sr-pill ${filtroSentimiento === "neutro" ? "sr-pill-activo" : ""}`}
                        onClick={() => setFiltroSentimiento("neutro")}
                      >
                        <FaMeh /> Neutras ({contarPorSentimiento("neutro")})
                      </button>
                      <button
                        className={`sr-pill ${filtroSentimiento === "negativo" ? "sr-pill-activo" : ""}`}
                        onClick={() => setFiltroSentimiento("negativo")}
                      >
                        <FaFrown /> Negativas (
                        {contarPorSentimiento("negativo")})
                      </button>
                    </div>
                    <div className="sr-orden">
                      <FaSortAmountDown className="sr-ctrl-icon" />
                      <select
                        value={ordenResenas}
                        onChange={(e) => setOrdenResenas(e.target.value)}
                        className="sr-select"
                      >
                        <option value="recientes">Más recientes</option>
                        <option value="mejores">Mejor calificadas</option>
                        <option value="peores">Peor calificadas</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {resenas.length === 0 ? (
                <p className="mensaje-vacio">
                  Aún no hay reseñas para este proveedor
                </p>
              ) : resenasMostradas.length === 0 ? (
                <p className="mensaje-vacio">
                  No hay reseñas que coincidan con los filtros seleccionados
                </p>
              ) : (
                <div className="resenas-lista">
                  {resenasMostradas.map((resena) => {
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
                          <span className={`sr-badge ${badge.class}`}>
                            {badge.icono} {badge.text}
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

      {/* Modal imagen */}
      {imagenModalAbierta && imagenSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarImagen}>
          <div
            className="modal-imagen-container"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-cerrar" onClick={handleCerrarImagen}>
              <FiX />
            </button>
            <img
              src={imagenSeleccionada.url_foto}
              alt={imagenSeleccionada.titulo || "Imagen ampliada"}
            />
            {(imagenSeleccionada.titulo ||
              imagenSeleccionada.descripcion ||
              imagenSeleccionada.fecha_subida) && (
              <div className="modal-imagen-info">
                {imagenSeleccionada.titulo && (
                  <h3>{imagenSeleccionada.titulo}</h3>
                )}
                {imagenSeleccionada.descripcion && (
                  <p>{imagenSeleccionada.descripcion}</p>
                )}
                {imagenSeleccionada.fecha_subida && (
                  <span className="modal-imagen-fecha">
                    <FiCalendar size={13} />
                    {new Date(
                      imagenSeleccionada.fecha_subida,
                    ).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal cotización */}
      {modalCotizacionAbierto && (
        <div className="modal-overlay" onClick={handleCerrarModalCotizacion}>
          <div
            className="modal-cotizacion"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <BsFileText /> Solicitar Cotización
              </h2>
              <button
                className="btn-cerrar-modal"
                onClick={handleCerrarModalCotizacion}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-descripcion">
                Completa los detalles de tu evento y {proveedor?.nombre_negocio}{" "}
                te enviará una cotización personalizada.
              </p>
              {/* Fecha */}
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
                    <FiCalendar />
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
              {/* Tipo de evento */}
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
              {/* Servicios checklist */}
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
                    seleccionado
                    {serviciosSeleccionados.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              {/* Invitados y presupuesto */}
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
                    max="99999999.99"
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
                  placeholder="Cuéntanos más sobre tu evento, preferencias especiales, horarios, etc."
                  className="form-control"
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancelar"
                onClick={handleCerrarModalCotizacion}
                disabled={enviandoSolicitud}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-enviar-solicitud"
                onClick={handleEnviarSolicitud}
                disabled={enviandoSolicitud}
              >
                {enviandoSolicitud ? "Enviando..." : "Enviar Solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal listas */}
      {mostrarModalListas && (
        <div
          className="modal-overlay"
          onClick={() => setMostrarModalListas(false)}
        >
          <div className="modal-listas" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiList /> Agregar a Lista
              </h2>
              <button
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalListas(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-descripcion">
                Selecciona la lista donde deseas agregar a{" "}
                {proveedor?.nombre_negocio}
              </p>
              {listasDisponibles.length === 0 ? (
                <div className="sin-listas">
                  <p>
                    Aún no tienes listas creadas. Ve a "Mis Eventos" para crear
                    una nueva lista.
                  </p>
                  <button
                    className="btn-ir-listas"
                    onClick={() => navigate("/mis-eventos")}
                  >
                    Ir a Mis Eventos
                  </button>
                </div>
              ) : (
                <>
                  <div className="listas-container">
                    {listasDisponibles.map((lista) => (
                      <label
                        key={lista.id_lista}
                        className={`lista-option 
    ${listaSeleccionada === lista.id_lista.toString() ? "seleccionada" : ""}
    ${lista.ya_incluido ? "ya-incluida" : ""}
  `}
                      >
                        <input
                          type="radio"
                          name="lista"
                          value={lista.id_lista}
                          checked={
                            listaSeleccionada === lista.id_lista.toString()
                          }
                          onChange={(e) => setListaSeleccionada(e.target.value)}
                          disabled={lista.ya_incluido}
                        />
                        <div className="lista-info">
                          <span className="lista-nombre">
                            {lista.nombre_lista}
                          </span>
                          {lista.descripcion && (
                            <span className="lista-descripcion">
                              {lista.descripcion}
                            </span>
                          )}
                          
                          {lista.ya_incluido && (
                            <span className="lista-ya-incluida">
                              ✓ Ya está en esta lista
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() => {
                        setMostrarModalListas(false);
                        setListaSeleccionada("");
                      }}
                      disabled={agregandoALista}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn-agregar-lista-confirm"
                      onClick={agregarALista}
                      disabled={agregandoALista || !listaSeleccionada}
                    >
                      {agregandoALista ? "Agregando..." : "Agregar a Lista"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default PerfilProveedor;
