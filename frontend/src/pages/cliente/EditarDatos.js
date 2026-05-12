import React, { useState, useEffect, useRef } from "react";
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
    foto_perfil: "",
    nueva_contrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [errores, setErrores] = useState({});
  const [ciudades, setCiudades] = useState([]);
  const fileInputRef = useRef(null);

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
        foto_perfil: datos.foto_perfil || "",
        nueva_contrasena: "",
      });
    } catch (error) {
      console.error("Error al cargar datos:", error);
    }
  };

  // ⭐ Handler para cambiar foto de perfil
  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten imágenes');
      return;
    }

    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    try {
      setUploadingFoto(true);

      const formDataFoto = new FormData();
      formDataFoto.append('logo', file);

      const response = await clienteService.actualizarFotoPerfil(formDataFoto);

      // Actualizar la foto en el estado local
      setFormData(prev => ({
        ...prev,
        foto_perfil: response.data.data.foto_perfil
      }));

      // Actualizar localStorage
      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          foto_perfil: response.data.data.foto_perfil
        })
      );

      alert('✅ Foto de perfil actualizada');
    } catch (error) {
      console.error('Error al actualizar foto:', error);
      alert('Error al actualizar la foto de perfil');
    } finally {
      setUploadingFoto(false);
    }
  };

  // ⭐ NUEVO: Handler para eliminar foto de perfil
  const handleEliminarFoto = async () => {
    if (!formData.foto_perfil) {
      alert('No tienes una foto de perfil para eliminar');
      return;
    }

    const confirmar = window.confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?');
    if (!confirmar) return;

    try {
      setUploadingFoto(true);

      await clienteService.eliminarFotoPerfil();

      // Limpiar la foto en el estado local
      setFormData(prev => ({
        ...prev,
        foto_perfil: ""
      }));

      // Actualizar localStorage
      const userStorage = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...userStorage,
          foto_perfil: ""
        })
      );

      alert('✅ Foto de perfil eliminada');
    } catch (error) {
      console.error('Error al eliminar foto:', error);
      alert('Error al eliminar la foto de perfil');
    } finally {
      setUploadingFoto(false);
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
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(valor)) {
      return "El nombre solo puede contener letras y espacios";
    }
    const palabras = valor.trim().split(/\s+/);
    if (palabras.length < 2) {
      return "Debes ingresar nombre y apellido";
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
    
    let valorProcesado = value;
    
    if (name === "nombre_completo") {
      valorProcesado = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
      
      if (valorProcesado.length > 100) {
        return;
      }
    }
    
    if (name === "telefono") {
      valorProcesado = value.replace(/[^\d\s\-()]/g, "");
      
      const soloNumeros = valorProcesado.replace(/[\s\-()]/g, "");
      if (soloNumeros.length > 10) {
        return;
      }
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
    nuevosErrores.nombre_completo = validarNombreCompleto(formData.nombre_completo);
    nuevosErrores.telefono = validarTelefono(formData.telefono);
    nuevosErrores.ciudad = formData.ciudad ? "" : "Debes seleccionar una ciudad";
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
        nombre_completo: formData.nombre_completo.trim(),
        telefono: formData.telefono.replace(/[\s\-()]/g, ""),
        ciudad: formData.ciudad,
      };

      if (formData.nueva_contrasena) {
        datosActualizar.nueva_contrasena = formData.nueva_contrasena;
      }

      await clienteService.actualizarPerfil(datosActualizar);

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
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          ciudad: formData.ciudad,
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
    <ClienteLayout>
      <div className="editar-datos-container">
        <h1>Editar mis datos personales</h1>

        <div className="editar-datos-content">
          {/* ⭐ AVATAR CLICKEABLE CON BOTÓN ELIMINAR */}
          <div className="avatar-section">
            <div 
              className="avatar-circle-clickable"
              onClick={() => !uploadingFoto && fileInputRef.current?.click()}
              style={{ cursor: uploadingFoto ? 'wait' : 'pointer' }}
            >
              {formData.foto_perfil ? (
                <img 
                  src={formData.foto_perfil} 
                  alt="Foto de perfil"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%'
                  }}
                />
              ) : (
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
              )}
              
              <div className="avatar-overlay">
                {uploadingFoto ? (
                  <span style={{ fontSize: '48px' }}>⏳</span>
                ) : (
                  <>
                    <span style={{ fontSize: '48px' }}>📷</span>
                    <span style={{ 
                      color: 'white', 
                      fontSize: '14px', 
                      fontWeight: '500',
                      marginTop: '8px'
                    }}>
                      Cambiar foto
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {/* ⭐ NUEVO: Botón para eliminar foto */}
            {formData.foto_perfil && !uploadingFoto && (
              <button
                type="button"
                onClick={handleEliminarFoto}
                className="btn-eliminar-foto"
              >
                🗑️ Eliminar foto
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              style={{ display: 'none' }}
            />
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
                <span className="error-message">⚠️ {errores.nombre_completo}</span>
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
    </ClienteLayout>
  );
}

export default EditarDatos;