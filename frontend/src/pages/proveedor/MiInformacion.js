import React, { useState, useEffect } from "react";
import api from "../../services/api";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import { useAuth } from "../../hooks/useAuth";
import "./MiInformacion.css";

function MiInformacion() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_negocio: "",
    correo: "",
    telefono: "",
    ciudad: "",
    tipo_servicio: "",
    descripcion: "",
    nueva_contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [errores, setErrores] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  
  // Estados para tipos de eventos
  const [tiposEventosDisponibles, setTiposEventosDisponibles] = useState([]);
  const [misEventos, setMisEventos] = useState([]);
  const [procesandoEvento, setProcesandoEvento] = useState(false);

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
      await api.post("/proveedor-eventos/mis-eventos", {
        id_tipo_evento,
      });
      
      // Recargar mis eventos
      await cargarMisEventos();
    } catch (error) {
      console.error("Error al agregar evento:", error);
      if (error.response?.status === 409) {
        alert("Este tipo de evento ya está agregado");
      } else {
        alert("Error al agregar el tipo de evento");
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
      
      // Recargar mis eventos
      await cargarMisEventos();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      alert("Error al eliminar el tipo de evento");
    } finally {
      setProcesandoEvento(false);
    }
  };

  const estaEventoAgregado = (id_tipo_evento) => {
    return misEventos.some((evento) => evento.id_tipo_evento === id_tipo_evento);
  };

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
        nueva_contrasena: "",
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  // ========== VALIDACIONES ==========

  const validarNombreNegocio = (valor) => {
    if (!valor.trim()) {
      return "El nombre del negocio es obligatorio";
    }
    if (valor.length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (valor.length > 100) {
      return "El nombre no puede exceder 100 caracteres";
    }
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-&.,()]+$/;
    if (!regex.test(valor)) {
      return "El nombre contiene caracteres no permitidos";
    }
    return "";
  };

  const validarTelefono = (valor) => {
    if (!valor.trim()) {
      return "";
    }
    
    const telefonoLimpio = valor.replace(/[\s\-()]/g, "");
    
    if (!/^\d+$/.test(telefonoLimpio)) {
      return "El teléfono debe contener solo números";
    }
    
    if (telefonoLimpio.length !== 10) {
      return "El teléfono debe tener 10 dígitos";
    }
    
    return "";
  };

  const validarDescripcion = (valor) => {
    if (!valor.trim()) {
      return "";
    }
    
    if (valor.length < 10) {
      return "La descripción debe tener al menos 10 caracteres";
    }
    
    if (valor.length > 1000) {
      return "La descripción no puede exceder 1000 caracteres";
    }
    
    return "";
  };

  const validarContrasena = (valor) => {
    if (!valor) {
      return "";
    }
    
    if (valor.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    
    if (valor.length > 50) {
      return "La contraseña no puede exceder 50 caracteres";
    }
    
    if (!/[A-Z]/.test(valor)) {
      return "La contraseña debe contener al menos una mayúscula";
    }
    
    if (!/[a-z]/.test(valor)) {
      return "La contraseña debe contener al menos una minúscula";
    }
    
    if (!/\d/.test(valor)) {
      return "La contraseña debe contener al menos un número";
    }
    
    return "";
  };

  const validarCampo = (nombre, valor) => {
    let error = "";
    
    switch (nombre) {
      case "nombre_negocio":
        error = validarNombreNegocio(valor);
        break;
      case "telefono":
        error = validarTelefono(valor);
        break;
      case "descripcion":
        error = validarDescripcion(valor);
        break;
      case "nueva_contrasena":
        error = validarContrasena(valor);
        break;
      case "ciudad":
        if (!valor) {
          error = "Debes seleccionar una ciudad";
        }
        break;
      case "tipo_servicio":
        if (!valor) {
          error = "Debes seleccionar un tipo de servicio";
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let valorProcesado = value;
    
    if (name === "telefono") {
      valorProcesado = value.replace(/[^\d\s\-()]/g, "");
      
      const soloNumeros = valorProcesado.replace(/[\s\-()]/g, "");
      if (soloNumeros.length > 10) {
        return;
      }
    }
    
    if (name === "nombre_negocio" && value.length > 100) {
      return;
    }
    
    if (name === "descripcion" && value.length > 1000) {
      return;
    }
    
    if (name === "nueva_contrasena" && value.length > 50) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: valorProcesado,
    });
    
    const error = validarCampo(name, valorProcesado);
    setErrores({
      ...errores,
      [name]: error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    const nuevosErrores = {};
    nuevosErrores.nombre_negocio = validarNombreNegocio(formData.nombre_negocio);
    nuevosErrores.telefono = validarTelefono(formData.telefono);
    nuevosErrores.ciudad = formData.ciudad ? "" : "Debes seleccionar una ciudad";
    nuevosErrores.tipo_servicio = formData.tipo_servicio ? "" : "Debes seleccionar un tipo de servicio";
    nuevosErrores.descripcion = validarDescripcion(formData.descripcion);
    nuevosErrores.nueva_contrasena = validarContrasena(formData.nueva_contrasena);

    const erroresActivos = Object.entries(nuevosErrores).filter(([_, valor]) => valor !== "");

    if (erroresActivos.length > 0) {
      setErrores(nuevosErrores);
      setMensaje({
        tipo: "error",
        texto: "Por favor corrige los errores antes de guardar",
      });
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

      setMensaje({
        tipo: "success",
        texto: "✓ Datos actualizados exitosamente",
      });

      setErrores({});

      setFormData({
        ...formData,
        nueva_contrasena: "",
      });

      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          nombre_negocio: formData.nombre_negocio,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
          tipo_servicio: formData.tipo_servicio,
        }),
      );
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || "❌ Error al actualizar datos",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProveedorLayout>
      <div className="mi-informacion-container">
        <h1>Editar mis datos personales</h1>

        <div className="informacion-content">
          <div className="avatar-section">
            <div className="avatar-circle">
              <svg viewBox="0 0 100 100" width="200" height="200">
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="#8ba9b5"
                  stroke="#6b8a96"
                  strokeWidth="2"
                />
                <circle cx="50" cy="40" r="18" fill="white" />
                <path d="M 25 75 Q 25 55, 50 55 Q 75 55, 75 75" fill="white" />
              </svg>
            </div>
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
                <span className="error-message">⚠️ {errores.nombre_negocio}</span>
              )}
              <small className="field-hint">
                {formData.nombre_negocio.length}/100 caracteres
              </small>
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
                <span className="error-message">⚠️ {errores.telefono}</span>
              )}
              <small className="field-hint">
                Ejemplo: 3312345678
              </small>
            </div>

            <div className="form-group">
              <select
                name="ciudad"
                className={`form-input form-select ${errores.ciudad ? "input-error" : ""}`}
                value={formData.ciudad}
                onChange={handleChange}
                required
                style={{
                  color: formData.ciudad === "" ? "#adb5bd" : "#495057",
                }}
              >
                <option value="" disabled hidden>
                  Selecciona tu ciudad
                </option>
                {ciudades.map((lugar) => (
                  <option key={lugar.id_lugar} value={lugar.ciudad}>
                    {lugar.ciudad}
                  </option>
                ))}
              </select>
              {errores.ciudad && (
                <span className="error-message">⚠️ {errores.ciudad}</span>
              )}
            </div>

            <div className="form-group">
              <select
                name="tipo_servicio"
                className={`form-input form-select ${errores.tipo_servicio ? "input-error" : ""}`}
                value={formData.tipo_servicio}
                onChange={handleChange}
                style={{
                  color: formData.tipo_servicio === "" ? "#adb5bd" : "#495057",
                }}
                required
              >
                <option value="" disabled hidden>
                  Selecciona el tipo de servicio
                </option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id_categoria}
                    value={categoria.nombre_categoria}
                  >
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>
              {errores.tipo_servicio && (
                <span className="error-message">⚠️ {errores.tipo_servicio}</span>
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
                <span className="error-message">⚠️ {errores.descripcion}</span>
              )}
              <small className="field-hint">
                {formData.descripcion.length}/1000 caracteres
                {formData.descripcion.length < 10 && formData.descripcion.length > 0 && 
                  ` (mínimo 10)`
                }
              </small>
            </div>

            {/* ========== SECCIÓN DE TIPOS DE EVENTOS ========== */}
            <div className="form-group">
              <label className="eventos-label">
                Tipos de eventos que atiendo
                <span className="eventos-hint">Selecciona los eventos en los que te especializas</span>
              </label>

              {/* Eventos agregados */}
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
                      <span className="evento-eliminar">×</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Eventos disponibles */}
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
                      <span className="evento-agregar">+</span>
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
                <span className="error-message">⚠️ {errores.nueva_contrasena}</span>
              )}
              <small className="field-hint">
                Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números
              </small>
            </div>

            {mensaje.texto && (
              <div className={`mensaje mensaje-${mensaje.tipo}`}>
                {mensaje.texto}
              </div>
            )}

            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? "Guardando..." : "✓ Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </ProveedorLayout>
  );
}

export default MiInformacion;