import api from "./api";

export const proveedorService = {
  // ========== PERFIL ==========
  obtenerPerfil: () => api.get("/proveedores/perfil"),
  actualizarPerfil: (datos) => api.put("/proveedores/perfil", datos),
  actualizarFotoPerfil: (formData) => 
    api.put("/proveedores/perfil/foto", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  eliminarFotoPerfil: () => api.delete("/proveedores/perfil/foto"),


  // ========== LUGARES ==========
  obtenerLugares: () => api.get("/lugares"),

  // ========== SERVICIOS ==========
  crearServicio: (datos) => api.post("/servicios", datos),
  obtenerMisServicios: () => api.get("/servicios/mis-servicios/lista"),
  actualizarServicio: (id, datos) => api.put(`/servicios/${id}`, datos),
  eliminarServicio: (id) => api.delete(`/servicios/${id}`),

  // ========== SOLICITUDES ==========
  obtenerSolicitudesRecibidas: (params) =>
    api.get("/solicitudes/recibidas", { params }),
  responderSolicitud: (id, datos) =>
    api.put(`/solicitudes/${id}/responder`, datos),

  // ========== MENSAJES ==========
  enviarMensaje: (id_solicitud, contenido) =>
    api.post(`/mensajes/solicitud/${id_solicitud}`, { contenido }),
  obtenerMensajes: (id_solicitud) =>
    api.get(`/mensajes/solicitud/${id_solicitud}`),
  obtenerConversaciones: () => api.get("/mensajes/conversaciones"),

  // ========== GALERÍA ==========
  obtenerMiGaleria: () => api.get("/galeria/mi-galeria"),
  
  // ⭐ ACTUALIZADO: Agregar foto con archivo (FormData)
  agregarFoto: (formData) => {
    // formData debe contener:
    // - foto: archivo de imagen
    // - descripcion (opcional)
    // - orden (opcional)
    return api.post("/galeria", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  eliminarFoto: (id) => api.delete(`/galeria/${id}`),
  
  obtenerInfoLimiteGaleria: () => api.get("/galeria/limite"),
  
  // Actualizar descripción u orden de una foto
  actualizarFoto: (id, datos) => api.put(`/galeria/${id}`, datos),
  
  // Reordenar múltiples fotos
  reordenarFotos: (orden) => api.put("/galeria/reordenar", { orden }),

  // ========== PROMOCIONES ==========
  crearPromocion: (datos) => api.post("/promociones", datos),
  obtenerMisPromociones: (params) =>
    api.get("/promociones/mis-promociones/lista", { params }),
  actualizarPromocion: (id, datos) => api.put(`/promociones/${id}`, datos),
  desactivarPromocion: (id) => api.put(`/promociones/${id}/desactivar`),
  eliminarPromocion: (id) => api.delete(`/promociones/${id}`),

  // ========== CALENDARIO ==========
  obtenerMiCalendario: (params) =>
    api.get("/calendario/mi-calendario", { params }),
  bloquearFecha: (fecha, motivo) =>
    api.post(`/calendario/bloquear/${fecha}`, { motivo }),
  liberarFecha: (fecha) => api.post(`/calendario/liberar/${fecha}`),
  bloquearMultiplesFechas: (fechas, motivo) =>
    api.post("/calendario/bloquear-multiples", { fechas, motivo }),
};