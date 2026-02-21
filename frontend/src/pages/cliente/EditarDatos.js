import React, { useState, useEffect } from "react";
import api from "../../services/api";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import { clienteService } from "../../services/clienteService";
import { useAuth } from "../../hooks/useAuth";
import "./EditarDatos.css";

function EditarDatos() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nombre_completo: "",
    correo: "",
    telefono: "",
    ciudad: "",
    nueva_contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [errores, setErrores] = useState({});
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    cargarDatos();
    cargarCiudades();
  }, []);

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
      const response = await clienteService.obtenerPerfil();
      const datos = response.data.data;
      setFormData({
        nombre_completo: datos.nombre_completo || "",
        correo: datos.correo || "",
        telefono: datos.telefono || "",
        ciudad: datos.ciudad || "",
        nueva_contrasena: "",
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  // ========== VALIDACIONES ==========

  const validarNombreCompleto = (valor) => {
    if (!valor.trim()) {
      return "El nombre completo es obligatorio";
    }
    if (valor.length < 3) {
      return "El nombre debe tener al menos 3 caracteres";
    }
    if (valor.length > 100) {
      return "El nombre no puede exceder 100 caracteres";
    }
    // Solo permitir letras, espacios, acentos y algunos caracteres comunes
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(valor)) {
      return "El nombre solo puede contener letras y espacios";
    }
    // Validar que tenga al menos nombre y apellido
    const palabras = valor.trim().split(/\s+/);
    if (palabras.length < 2) {
      return "Debes ingresar nombre y apellido";
    }
    return "";
  };

  const validarTelefono = (valor) => {
    if (!valor.trim()) {
      return ""; // El teléfono es opcional
    }
    
    // Eliminar espacios, guiones y paréntesis para validar
    const telefonoLimpio = valor.replace(/[\s\-()]/g, "");
    
    // Debe contener solo números
    if (!/^\d+$/.test(telefonoLimpio)) {
      return "El teléfono debe contener solo números";
    }
    
    // Validar longitud (10 dígitos para México)
    if (telefonoLimpio.length !== 10) {
      return "El teléfono debe tener 10 dígitos";
    }
    
    return "";
  };

  const validarContrasena = (valor) => {
    if (!valor) {
      return ""; // La contraseña es opcional (solo si quiere cambiarla)
    }
    
    if (valor.length < 8) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    
    if (valor.length > 50) {
      return "La contraseña no puede exceder 50 caracteres";
    }
    
    // Al menos una mayúscula
    if (!/[A-Z]/.test(valor)) {
      return "La contraseña debe contener al menos una mayúscula";
    }
    
    // Al menos una minúscula
    if (!/[a-z]/.test(valor)) {
      return "La contraseña debe contener al menos una minúscula";
    }
    
    // Al menos un número
    if (!/\d/.test(valor)) {
      return "La contraseña debe contener al menos un número";
    }
    
    return "";
  };

  const validarCampo = (nombre, valor) => {
    let error = "";
    
    switch (nombre) {
      case "nombre_completo":
        error = validarNombreCompleto(valor);
        break;
      case "telefono":
        error = validarTelefono(valor);
        break;
      case "nueva_contrasena":
        error = validarContrasena(valor);
        break;
      case "ciudad":
        if (!valor) {
          error = "Debes seleccionar una ciudad";
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validaciones en tiempo real
    let valorProcesado = value;
    
    // Permitir solo letras y espacios en nombre completo
    if (name === "nombre_completo") {
      valorProcesado = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      
      // Limitar a 100 caracteres
      if (valorProcesado.length > 100) {
        return;
      }
    }
    
    // Permitir solo números en teléfono (con formato)
    if (name === "telefono") {
      // Permitir solo números, espacios, guiones y paréntesis
      valorProcesado = value.replace(/[^\d\s\-()]/g, "");
      
      // Limitar a 10 dígitos (sin contar formato)
      const soloNumeros = valorProcesado.replace(/[\s\-()]/g, "");
      if (soloNumeros.length > 10) {
        return;
      }
    }
    
    // Limitar caracteres en contraseña
    if (name === "nueva_contrasena" && value.length > 50) {
      return;
    }
    
    setFormData({
      ...formData,
      [name]: valorProcesado,
    });
    
    // Validar el campo y actualizar errores
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

    // Validar todos los campos
    const nuevosErrores = {};
    nuevosErrores.nombre_completo = validarNombreCompleto(formData.nombre_completo);
    nuevosErrores.telefono = validarTelefono(formData.telefono);
    nuevosErrores.ciudad = formData.ciudad ? "" : "Debes seleccionar una ciudad";
    nuevosErrores.nueva_contrasena = validarContrasena(formData.nueva_contrasena);

    // Filtrar solo errores que tengan contenido
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
        nombre_completo: formData.nombre_completo.trim(),
        telefono: formData.telefono.replace(/[\s\-()]/g, ""), // Enviar solo números
        ciudad: formData.ciudad,
      };

      // Si hay nueva contraseña, agregarla
      if (formData.nueva_contrasena) {
        datosActualizar.nueva_contrasena = formData.nueva_contrasena;
      }

      await clienteService.actualizarPerfil(datosActualizar);

      setMensaje({
        tipo: "success",
        texto: " Datos actualizados exitosamente",
      });

      // Limpiar errores
      setErrores({});

      // Limpiar campo de contraseña
      setFormData({
        ...formData,
        nueva_contrasena: "",
      });

      // Actualizar localStorage
      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
        }),
      );
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || " Error al actualizar datos",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClienteLayout>
      <div className="editar-datos-container">
        <h1>Editar mis datos personales</h1>

        <div className="editar-datos-content">
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

          <form onSubmit={handleSubmit} className="datos-form">
            <div className="form-group">
              <input
                type="text"
                name="nombre_completo"
                className={`form-input ${errores.nombre_completo ? "input-error" : ""}`}
                placeholder="Nombre y Apellidos"
                value={formData.nombre_completo}
                onChange={handleChange}
                required
              />
              {errores.nombre_completo && (
                <span className="error-message"> {errores.nombre_completo}</span>
              )}
              <small className="field-hint">
                {formData.nombre_completo.length}/100 caracteres - Solo letras
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
                <span className="error-message"> {errores.telefono}</span>
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
                <span className="error-message"> {errores.ciudad}</span>
              )}
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
                <span className="error-message"> {errores.nueva_contrasena}</span>
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
              {loading ? "Guardando..." : " Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </ClienteLayout>
  );
}

export default EditarDatos;