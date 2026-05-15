import React, { useState, useEffect } from "react";
import api from "../../services/api";
import ClienteLayout from "../../components/cliente/ClienteLayout";
import "./Preferencias.css";

function Preferencias() {
  const [formData, setFormData] = useState({
    tipos_eventos: [],
    servicios_preferidos: [],
    ubicacion_preferida: "",
    precio_min: "",
    precio_max: "",
  });
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  
  // Catálogos
  const [tiposEventosDisponibles, setTiposEventosDisponibles] = useState([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      
      // Cargar preferencias existentes
      const prefResponse = await api.get("/recomendaciones/preferencias");
      if (prefResponse.data.data) {
        const pref = prefResponse.data.data;
        setFormData({
          tipos_eventos: pref.tipos_eventos || [],
          servicios_preferidos: pref.servicios_preferidos || [],
          ubicacion_preferida: pref.ubicacion_preferida || "",
          precio_min: pref.precio_min || "",
          precio_max: pref.precio_max || "",
        });
      }

      // Cargar catálogos - CORREGIDAS LAS RUTAS
      const [eventosRes, categoriasRes, ciudadesRes] = await Promise.all([
        api.get("/tipos-eventos"),  // ✅ CORREGIDO: era /tipo-evento
        api.get("/categorias"),
        api.get("/lugar")
      ]);

      setTiposEventosDisponibles(eventosRes.data.data || []);
      setCategoriasDisponibles(categoriasRes.data.data || []);
      setCiudades(ciudadesRes.data.data || []);

    } catch (error) {
      console.error("Error al cargar datos:", error);
      setMensaje({
        tipo: "error",
        texto: "Error al cargar las preferencias"
      });
    } finally {
      setCargando(false);
    }
  };

  const toggleSeleccion = (campo, valor) => {
    setFormData(prev => {
      const array = Array.isArray(prev[campo]) ? prev[campo] : [];
      const existe = array.includes(valor);
      
      return {
        ...prev,
        [campo]: existe 
          ? array.filter(item => item !== valor)
          : [...array, valor]
      };
    });
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
      await api.post("/recomendaciones/preferencias", formData);

      setMensaje({
        tipo: "success",
        texto: "✓ Preferencias guardadas exitosamente. Esto mejorará tus recomendaciones.",
      });
    } catch (error) {
      console.error("Error al guardar preferencias:", error);
      setMensaje({
        tipo: "error",
        texto: error.response?.data?.message || "❌ Error al guardar preferencias",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLimpiar = async () => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar todas tus preferencias?")) {
      return;
    }

    try {
      setLoading(true);
      await api.delete("/recomendaciones/preferencias");
      
      setFormData({
        tipos_eventos: [],
        servicios_preferidos: [],
        ubicacion_preferida: "",
        precio_min: "",
        precio_max: "",
      });

      setMensaje({
        tipo: "success",
        texto: "✓ Preferencias eliminadas"
      });
    } catch (error) {
      console.error("Error al eliminar preferencias:", error);
      setMensaje({
        tipo: "error",
        texto: "Error al eliminar preferencias"
      });
    } finally {
      setLoading(false);
    }
  };

  if (cargando) {
    return (
      <ClienteLayout>
        <div className="preferencias-container">
          <div className="loading-spinner">Cargando...</div>
        </div>
      </ClienteLayout>
    );
  }

  return (
    <ClienteLayout>
      <div className="preferencias-container">
        <div className="preferencias-header">
          <h1>Mis Preferencias</h1>
          <p className="preferencias-subtitle">
            Configura tus preferencias para recibir recomendaciones personalizadas de proveedores
          </p>
        </div>

        <form onSubmit={handleSubmit} className="preferencias-form">
          
          {/* ========== TIPOS DE EVENTOS ========== */}
          <div className="form-section">
            <h3>📅 Tipos de eventos de interés</h3>
            <p className="section-hint">Selecciona los tipos de eventos que te interesan</p>
            
            <div className="opciones-grid">
              {tiposEventosDisponibles.map((tipo) => (
                <button
                  key={tipo.id_tipo_evento}
                  type="button"
                  className={`opcion-card ${
                    formData.tipos_eventos.includes(tipo.nombre_evento)
                      ? "seleccionado"
                      : ""
                  }`}
                  onClick={() => toggleSeleccion("tipos_eventos", tipo.nombre_evento)}
                >
                  <span className="opcion-icono">{tipo.icono || "📍"}</span>
                  <span className="opcion-nombre">{tipo.nombre_evento}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ========== SERVICIOS PREFERIDOS ========== */}
          <div className="form-section">
            <h3>🎯 Servicios preferidos</h3>
            <p className="section-hint">¿Qué tipo de servicios buscas normalmente?</p>
            
            <div className="opciones-grid">
              {categoriasDisponibles.map((categoria) => (
                <button
                  key={categoria.id_categoria}
                  type="button"
                  className={`opcion-card ${
                    formData.servicios_preferidos.includes(categoria.nombre_categoria)
                      ? "seleccionado"
                      : ""
                  }`}
                  onClick={() => toggleSeleccion("servicios_preferidos", categoria.nombre_categoria)}
                >
                  <span className="opcion-icono">🎪</span>
                  <span className="opcion-nombre">{categoria.nombre_categoria}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ========== UBICACIÓN ========== */}
          <div className="form-section">
            <h3>📍 Ubicación preferida</h3>
            <p className="section-hint">¿En qué ciudad prefieres buscar proveedores?</p>
            
            <select
              name="ubicacion_preferida"
              className="form-input form-select"
              value={formData.ubicacion_preferida}
              onChange={handleChange}
            >
              <option value="">Selecciona una ciudad</option>
              {ciudades.map((lugar) => (
                <option key={lugar.id_lugar} value={lugar.ciudad}>
                  {lugar.ciudad}
                </option>
              ))}
            </select>
          </div>

          {/* ========== RANGO DE PRECIOS ========== */}
          <div className="form-section">
            <h3>💰 Rango de precios</h3>
            <p className="section-hint">Define tu presupuesto aproximado por servicio</p>
            
            <div className="precio-inputs">
              <div className="precio-field">
                <label>Mínimo</label>
                <input
                  type="number"
                  name="precio_min"
                  className="form-input"
                  placeholder="$0"
                  value={formData.precio_min}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              
              <span className="precio-separador">-</span>
              
              <div className="precio-field">
                <label>Máximo</label>
                <input
                  type="number"
                  name="precio_max"
                  className="form-input"
                  placeholder="$10,000"
                  value={formData.precio_max}
                  onChange={handleChange}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* ========== MENSAJES ========== */}
          {mensaje.texto && (
            <div className={`mensaje mensaje-${mensaje.tipo}`}>
              {mensaje.texto}
            </div>
          )}

          {/* ========== BOTONES ========== */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleLimpiar}
              className="btn-limpiar"
              disabled={loading}
            >
              🗑️ Eliminar preferencias
            </button>
            
            <button
              type="submit"
              className="btn-guardar"
              disabled={loading}
            >
              {loading ? "Guardando..." : "✓ Guardar preferencias"}
            </button>
          </div>
        </form>
      </div>
    </ClienteLayout>
  );
}

export default Preferencias;