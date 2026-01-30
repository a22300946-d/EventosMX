import api from "./api";

export const proveedorService = {
  // Perfil
  obtenerPerfil: () => api.get("/proveedores/perfil"),
  actualizarPerfil: (datos) => api.put("/proveedores/perfil", datos),

  // Lugares
  obtenerLugares: () => api.get("/lugares"),

  // Servicios
  crearServicio: (datos) => api.post("/servicios", datos),
  obtenerMisServicios: () => api.get("/servicios/mis-servicios/lista"),
  actualizarServicio: (id, datos) => api.put(`/servicios/${id}`, datos),
  eliminarServicio: (id) => api.delete(`/servicios/${id}`),

  // Solicitudes
  obtenerSolicitudesRecibidas: (params) =>
    api.get("/solicitudes/recibidas", { params }),
  responderSolicitud: (id, datos) =>
    api.put(`/solicitudes/${id}/responder`, datos),

  // Mensajes
  enviarMensaje: (id_solicitud, contenido) =>
    api.post(`/mensajes/solicitud/${id_solicitud}`, { contenido }),
  obtenerMensajes: (id_solicitud) =>
    api.get(`/mensajes/solicitud/${id_solicitud}`),
  obtenerConversaciones: () => api.get("/mensajes/conversaciones"),

  // Galería
  obtenerMiGaleria: () => api.get("/galeria/mi-galeria"),
  agregarFoto: (datos) => api.post("/galeria", datos),
  eliminarFoto: (id) => api.delete(`/galeria/${id}`),
  obtenerInfoLimiteGaleria: () => api.get("/galeria/limite"),

  // Promociones
  crearPromocion: (datos) => api.post("/promociones", datos),
  obtenerMisPromociones: (params) =>
    api.get("/promociones/mis-promociones/lista", { params }),
  actualizarPromocion: (id, datos) => api.put(`/promociones/${id}`, datos),
  desactivarPromocion: (id) => api.put(`/promociones/${id}/desactivar`),
  eliminarPromocion: (id) => api.delete(`/promociones/${id}`),

  // Calendario
  obtenerMiCalendario: (params) =>
    api.get("/calendario/mi-calendario", { params }),
  bloquearFecha: (fecha, motivo) =>
    api.post(`/calendario/bloquear/${fecha}`, { motivo }),
  liberarFecha: (fecha) => api.post(`/calendario/liberar/${fecha}`),
  bloquearMultiplesFechas: (fechas, motivo) =>
    api.post("/calendario/bloquear-multiples", { fechas, motivo }),
};
