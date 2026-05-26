import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { useAuth } from "../../hooks/useAuth";
import { ModalConfirm, ModalAlert, useModal } from "../../components/modales";
import "./MiInformacion.css";

import { FiCamera, FiTrash2, FiCheck, FiAlertTriangle, FiLoader, FiPlus, FiX } from "react-icons/fi";
import { AiOutlineHourglass } from "react-icons/ai";

function MiInformacion() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_negocio: "",
    correo: "",
    telefono: "",
    ciudad: "",
    tipo_servicio: "",
    descripcion: "",
    logo: "",
    nueva_contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const fileInputRef = useRef(null);

  const [tiposEventosDisponibles, setTiposEventosDisponibles] = useState([]);
  const [misEventos, setMisEventos] = useState([]);
  const [procesandoEvento, setProcesandoEvento] = useState(false);

  const {
    modalConfirm,
    modalAlert,
    mostrarAlerta,
    mostrarConfirmacion,
    cerrarConfirm,
    cerrarAlert,
  } = useModal();

  useEffect(() => {
    cargarDatos();
    cargarCategorias();
    cargarCiudades();
    cargarTiposEventos();
    cargarMisEventos();
  }, []);

  const cargarTiposEventos = async () => {
    try {
      const response = await api.get("/proveedor-eventos/tipos-eventos");
      setTiposEventosDisponibles(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar tipos de eventos:", error);
    }
  };

  const cargarMisEventos = async () => {
    try {
      const response = await api.get("/proveedor-eventos/mis-eventos");
      setMisEventos(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar mis eventos:", error);
    }
  };

  const agregarEvento = async (id_tipo_evento) => {
    if (procesandoEvento) return;
    try {
      setProcesandoEvento(true);
      await api.post("/proveedor-eventos/mis-eventos", { id_tipo_evento });
      await cargarMisEventos();
    } catch (error) {
      console.error("Error al agregar evento:", error);
      if (error.response?.status === 409) {
        mostrarAlerta("Evento duplicado", "Este tipo de evento ya está agregado.", "error");
      } else {
        mostrarAlerta("Error", "No se pudo agregar el tipo de evento.", "error");
      }
    } finally {
      setProcesandoEvento(false);
    }
  };

  const eliminarEvento = async (id_tipo_evento) => {
    if (procesandoEvento) return;
    try {
      setProcesandoEvento(true);
      await api.delete(`/proveedor-eventos/mis-eventos/${id_tipo_evento}`);
      await cargarMisEventos();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      mostrarAlerta("Error", "No se pudo eliminar el tipo de evento.", "error");
    } finally {
      setProcesandoEvento(false);
    }
  };

  const estaEventoAgregado = (id_tipo_evento) =>
    misEventos.some((evento) => evento.id_tipo_evento === id_tipo_evento);

  const cargarCategorias = async () => {
    try {
      const response = await api.get("/categorias");
      setCategorias(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
    }
  };

  const cargarCiudades = async () => {
    try {
      const response = await api.get("/lugar");
      setCiudades(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar ciudades:", error);
    }
  };

  const cargarDatos = async () => {
    try {
      const response = await proveedorService.obtenerPerfil();
      const datos = response.data.data;
      setFormData({
        nombre_negocio: datos.nombre_negocio || "",
        correo: datos.correo || "",
        telefono: datos.telefono || "",
        ciudad: datos.ciudad || "",
        tipo_servicio: datos.tipo_servicio || "",
        descripcion: datos.descripcion || "",
        logo: datos.logo || "",
        nueva_contrasena: "",
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      mostrarAlerta("Formato no válido", "Solo se permiten imágenes.", "error");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      mostrarAlerta("Archivo muy grande", "La imagen no debe superar los 2MB.", "error");
      return;
    }

    try {
      setUploadingFoto(true);
      const formDataFoto = new FormData();
      formDataFoto.append("logo", file);

      const response = await proveedorService.actualizarFotoPerfil(formDataFoto);

      setFormData((prev) => ({ ...prev, logo: response.data.data.logo }));

      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({ ...userStorage, logo: response.data.data.logo })
      );

      mostrarAlerta("Foto actualizada", "Tu foto de perfil se actualizó correctamente.", "success");
    } catch (error) {
      console.error("Error al actualizar foto:", error);
      mostrarAlerta("Error", "No se pudo actualizar la foto de perfil.", "error");
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleEliminarFoto = () => {
    if (!formData.logo) {
      mostrarAlerta("Sin foto", "No tienes una foto de perfil para eliminar.", "info");
      return;
    }

    mostrarConfirmacion({
      title: "¿Eliminar foto de perfil?",
      message: "Se eliminará tu foto de perfil actual.",
      confirmLabel: "Eliminar",
      onConfirm: async () => {
        cerrarConfirm();
        try {
          setUploadingFoto(true);
          await proveedorService.eliminarFotoPerfil();

          setFormData((prev) => ({ ...prev, logo: "" }));

          const userStorage = JSON.parse(localStorage.getItem("user"));
          localStorage.setItem("user", JSON.stringify({ ...userStorage, logo: "" }));

          mostrarAlerta("Foto eliminada", "Tu foto de perfil fue eliminada.", "success");
        } catch (error) {
          console.error("Error al eliminar foto:", error);
          mostrarAlerta("Error", "No se pudo eliminar la foto de perfil.", "error");
        } finally {
          setUploadingFoto(false);
        }
      },
    });
  };

  const validarNombreNegocio = (valor) => {
    if (!valor.trim()) return "El nombre del negocio es obligatorio";
    if (valor.length < 3) return "El nombre debe tener al menos 3 caracteres";
    if (valor.length > 100) return "El nombre no puede exceder 100 caracteres";
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-&.,()]+$/;
    if (!regex.test(valor)) return "El nombre contiene caracteres no permitidos";
    return "";
  };

  const validarTelefono = (valor) => {
    if (!valor.trim()) return "";
    const telefonoLimpio = valor.replace(/[\s\-()]/g, "");
    if (!/^\d+$/.test(telefonoLimpio)) return "El teléfono debe contener solo números";
    if (telefonoLimpio.length !== 10) return "El teléfono debe tener 10 dígitos";
    return "";
  };

  const validarDescripcion = (valor) => {
    if (!valor.trim()) return "";
    if (valor.length < 10) return "La descripción debe tener al menos 10 caracteres";
    if (valor.length > 1000) return "La descripción no puede exceder 1000 caracteres";
    return "";
  };

  const validarContrasena = (valor) => {
    if (!valor) return "";
    if (valor.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (valor.length > 50) return "La contraseña no puede exceder 50 caracteres";
    if (!/[A-Z]/.test(valor)) return "La contraseña debe contener al menos una mayúscula";
    if (!/[a-z]/.test(valor)) return "La contraseña debe contener al menos una minúscula";
    if (!/\d/.test(valor)) return "La contraseña debe contener al menos un número";
    return "";
  };

  const validarCampo = (nombre, valor) => {
    switch (nombre) {
      case "nombre_negocio": return validarNombreNegocio(valor);
      case "telefono": return validarTelefono(valor);
      case "descripcion": return validarDescripcion(valor);
      case "nueva_contrasena": return validarContrasena(valor);
      case "ciudad": return !valor ? "Debes seleccionar una ciudad" : "";
      case "tipo_servicio": return !valor ? "Debes seleccionar un tipo de servicio" : "";
      default: return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let valorProcesado = value;

    if (name === "telefono") {
      valorProcesado = value.replace(/[^\d\s\-()]/g, "");
      const soloNumeros = valorProcesado.replace(/[\s\-()]/g, "");
      if (soloNumeros.length > 10) return;
    }

    if (name === "nombre_negocio" && value.length > 100) return;
    if (name === "descripcion" && value.length > 1000) return;
    if (name === "nueva_contrasena" && value.length > 50) return;

    setFormData({ ...formData, [name]: valorProcesado });
    setErrores({ ...errores, [name]: validarCampo(name, valorProcesado) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    const nuevosErrores = {
      nombre_negocio: validarNombreNegocio(formData.nombre_negocio),
      telefono: validarTelefono(formData.telefono),
      ciudad: formData.ciudad ? "" : "Debes seleccionar una ciudad",
      tipo_servicio: formData.tipo_servicio ? "" : "Debes seleccionar un tipo de servicio",
      descripcion: validarDescripcion(formData.descripcion),
      nueva_contrasena: validarContrasena(formData.nueva_contrasena),
    };

    const erroresActivos = Object.entries(nuevosErrores).filter(([_, v]) => v !== "");

    if (erroresActivos.length > 0) {
      setErrores(nuevosErrores);
      setMensaje({ tipo: "error", texto: "Por favor corrige los errores antes de guardar" });
      setLoading(false);
      return;
    }

    try {
      const datosActualizar = {
        nombre_negocio: formData.nombre_negocio.trim(),
        telefono: formData.telefono.replace(/[\s\-()]/g, ""),
        ciudad: formData.ciudad,
        tipo_servicio: formData.tipo_servicio,
        descripcion: formData.descripcion.trim(),
      };

      if (formData.nueva_contrasena) {
        datosActualizar.nueva_contrasena = formData.nueva_contrasena;
      }

      await proveedorService.actualizarPerfil(datosActualizar);

      setMensaje({ tipo: "success", texto: "Datos actualizados exitosamente" });
      setErrores({});
      setFormData({ ...formData, nueva_contrasena: "" });

      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          nombre_negocio: formData.nombre_negocio,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
          tipo_servicio: formData.tipo_servicio,
        })
      );

      mostrarAlerta("¡Datos actualizados!", "Tu información se guardó correctamente.", "success");
    } catch (error) {
      mostrarAlerta(
        "Error al guardar",
        error.response?.data?.message || "No se pudieron actualizar los datos.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProveedorLayout>
      <div className="mi-informacion-container">
        <h1>Editar mis datos personales</h1>

        <div className="informacion-content">
          {/* AVATAR */}
          <div className="avatar-section">
            <div
              className="avatar-circle-clickable"
              onClick={() => !uploadingFoto && fileInputRef.current?.click()}
              style={{ cursor: uploadingFoto ? "wait" : "pointer" }}
            >
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Foto de perfil"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                <svg viewBox="0 0 100 100" width="200" height="200">
                  <circle cx="50" cy="50" r="48" fill="#8ba9b5" stroke="#6b8a96" strokeWidth="2" />
                  <circle cx="50" cy="40" r="18" fill="white" />
                  <path d="M 25 75 Q 25 55, 50 55 Q 75 55, 75 75" fill="white" />
                </svg>
              )}
              <div className="avatar-overlay">
                {uploadingFoto ? (
                  <AiOutlineHourglass size={48} color="white" />
                ) : (
                  <>
                    <FiCamera size={48} color="white" />
                    <span style={{ color: "white", fontSize: "14px", fontWeight: "500", marginTop: "8px" }}>
                      Cambiar foto
                    </span>
                  </>
                )}
              </div>
            </div>

            {formData.logo && !uploadingFoto && (
              <button type="button" onClick={handleEliminarFoto} className="btn-eliminar-foto">
                <FiTrash2 /> Eliminar foto
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              style={{ display: "none" }}
            />
          </div>

          <form onSubmit={handleSubmit} className="informacion-form">
            <div className="form-group">
              <input
                type="text"
                name="nombre_negocio"
                className={`form-input ${errores.nombre_negocio ? "input-error" : ""}`}
                placeholder="Nombre del negocio"
                value={formData.nombre_negocio}
                onChange={handleChange}
                required
              />
              {errores.nombre_negocio && (
                <span className="error-message"><FiAlertTriangle /> {errores.nombre_negocio}</span>
              )}
              <small className="field-hint">{formData.nombre_negocio.length}/100 caracteres</small>
            </div>

            <div className="form-group">
              <input
                type="email"
                name="correo"
                className="form-input"
                placeholder="Email"
                value={formData.correo}
                disabled
                style={{ backgroundColor: "#e9ecef", cursor: "not-allowed" }}
              />
              <small className="field-hint">El correo no se puede modificar</small>
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="telefono"
                className={`form-input ${errores.telefono ? "input-error" : ""}`}
                placeholder="Teléfono (10 dígitos)"
                value={formData.telefono}
                onChange={handleChange}
                maxLength="14"
              />
              {errores.telefono && (
                <span className="error-message"><FiAlertTriangle /> {errores.telefono}</span>
              )}
              <small className="field-hint">Ejemplo: 3312345678</small>
            </div>

            <div className="form-group">
              <select
                name="ciudad"
                className={`form-input form-select ${errores.ciudad ? "input-error" : ""}`}
                value={formData.ciudad}
                onChange={handleChange}
                required
                style={{ color: formData.ciudad === "" ? "#adb5bd" : "#495057" }}
              >
                <option value="" disabled hidden>Selecciona tu ciudad</option>
                {ciudades.map((lugar) => (
                  <option key={lugar.id_lugar} value={lugar.ciudad}>{lugar.ciudad}</option>
                ))}
              </select>
              {errores.ciudad && (
                <span className="error-message"><FiAlertTriangle /> {errores.ciudad}</span>
              )}
            </div>

            <div className="form-group">
              <select
                name="tipo_servicio"
                className={`form-input form-select ${errores.tipo_servicio ? "input-error" : ""}`}
                value={formData.tipo_servicio}
                onChange={handleChange}
                required
                style={{ color: formData.tipo_servicio === "" ? "#adb5bd" : "#495057" }}
              >
                <option value="" disabled hidden>Selecciona el tipo de servicio</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.nombre_categoria}>
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>
              {errores.tipo_servicio && (
                <span className="error-message"><FiAlertTriangle /> {errores.tipo_servicio}</span>
              )}
            </div>

            <div className="form-group">
              <textarea
                name="descripcion"
                className={`form-input ${errores.descripcion ? "input-error" : ""}`}
                placeholder="Descripción del negocio (mínimo 10 caracteres)"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
              />
              {errores.descripcion && (
                <span className="error-message"><FiAlertTriangle /> {errores.descripcion}</span>
              )}
              <small className="field-hint">
                {formData.descripcion.length}/1000 caracteres
                {formData.descripcion.length < 10 && formData.descripcion.length > 0 && " (mínimo 10)"}
              </small>
            </div>

            {/* TIPOS DE EVENTOS */}
            <div className="form-group">
              <label className="eventos-label">
                Tipos de eventos que atiendo
                <span className="eventos-hint">Selecciona los eventos en los que te especializas</span>
              </label>

              {misEventos.length > 0 && (
                <div className="eventos-seleccionados">
                  {misEventos.map((evento) => (
                    <button
                      key={evento.id_tipo_evento}
                      type="button"
                      className="evento-tag evento-agregado"
                      onClick={() => eliminarEvento(evento.id_tipo_evento)}
                      disabled={procesandoEvento}
                    >
                      <span className="evento-icono">{evento.icono}</span>
                      <span className="evento-nombre">{evento.nombre_evento}</span>
                      <FiX className="evento-eliminar" />
                    </button>
                  ))}
                </div>
              )}

              <div className="eventos-disponibles">
                {tiposEventosDisponibles
                  .filter((tipo) => !estaEventoAgregado(tipo.id_tipo_evento))
                  .map((tipo) => (
                    <button
                      key={tipo.id_tipo_evento}
                      type="button"
                      className="evento-tag evento-disponible"
                      onClick={() => agregarEvento(tipo.id_tipo_evento)}
                      disabled={procesandoEvento}
                    >
                      <span className="evento-icono">{tipo.icono}</span>
                      <span className="evento-nombre">{tipo.nombre_evento}</span>
                      <FiPlus className="evento-agregar" />
                    </button>
                  ))}
              </div>
            </div>

            <div className="form-group">
              <input
                type="password"
                name="nueva_contrasena"
                className={`form-input ${errores.nueva_contrasena ? "input-error" : ""}`}
                placeholder="Nueva Contraseña (opcional)"
                value={formData.nueva_contrasena}
                onChange={handleChange}
              />
              {errores.nueva_contrasena && (
                <span className="error-message"><FiAlertTriangle /> {errores.nueva_contrasena}</span>
              )}
              <small className="field-hint">
                Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
              </small>
            </div>

            {mensaje.texto && (
              <div className={`mensaje mensaje-${mensaje.tipo}`}>
                {mensaje.tipo === "success" ? <FiCheck /> : <FiAlertTriangle />}
                {mensaje.texto}
              </div>
            )}

            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? <><FiLoader /> Guardando...</> : <><FiCheck /> Guardar cambios</>}
            </button>
          </form>
        </div>
      </div>

      <ModalConfirm
        config={modalConfirm}
        onConfirm={modalConfirm?.onConfirm}
        onCancel={cerrarConfirm}
      />
      <ModalAlert
        config={modalAlert}
        onClose={cerrarAlert}
      />
    </ProveedorLayout>
  );
}

export default MiInformacion;