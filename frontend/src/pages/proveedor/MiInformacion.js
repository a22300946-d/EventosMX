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
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    cargarDatos();
    cargarCategorias();
    cargarCiudades();
  }, []);

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      const datosActualizar = {
        nombre_negocio: formData.nombre_negocio,
        telefono: formData.telefono,
        ciudad: formData.ciudad,
        tipo_servicio: formData.tipo_servicio,
        descripcion: formData.descripcion,
      };

      await proveedorService.actualizarPerfil(datosActualizar);

      setMensaje({
        tipo: "success",
        texto: "Datos actualizados exitosamente",
      });

      // Actualizar localStorage
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
        texto: error.response?.data?.message || "Error al actualizar datos",
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
                className="form-input"
                placeholder="Nombre del negocio"
                value={formData.nombre_negocio}
                onChange={handleChange}
                required
              />
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
            </div>

            <div className="form-group">
              <input
                type="tel"
                name="telefono"
                className="form-input"
                placeholder="Telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <select
                name="ciudad"
                className="form-input form-select"
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
            </div>

            <div className="form-group">
              <select
                name="tipo_servicio"
                className="form-input form-select"
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
            </div>

            <div className="form-group">
              <textarea
                name="descripcion"
                className="form-input"
                placeholder="Descripcion del negocio"
                value={formData.descripcion}
                onChange={handleChange}
                rows="4"
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="nueva_contrasena"
                className="form-input"
                placeholder="Nueva Contraseña"
                value={formData.nueva_contrasena}
                onChange={handleChange}
              />
            </div>

            {mensaje.texto && (
              <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
            )}

            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </div>
      </div>
    </ProveedorLayout>
  );
}

export default MiInformacion;
