import api from "./api";

export const clienteService = {
  // Perfil
  obtenerPerfil: () => api.get("/clientes/perfil"),
  actualizarPerfil: (datos) => api.put("/clientes/perfil", datos),

  // Servicios
  buscarServicios: (params) => api.get("/servicios/buscar", { params }),
  obtenerServicio: (id) => api.get(`/servicios/${id}`),

  // Categorías
  obtenerCategorias: () => api.get("/categorias"),

  // Lugares
  obtenerLugares: () => api.get("/lugares"),

  // Proveedores
  buscarProveedores: (params) => api.get("/proveedores/buscar", { params }),
  obtenerProveedor: (id) => api.get(`/proveedores/publico/${id}`),

  // Solicitudes
  crearSolicitud: (datos) => api.post("/solicitudes", datos),
  obtenerMisSolicitudes: (params) =>
    api.get("/solicitudes/mis-solicitudes", { params }),
  obtenerSolicitud: (id) => api.get(`/solicitudes/${id}`),
  aceptarSolicitud: (id) => api.put(`/solicitudes/${id}/aceptar`),
  rechazarSolicitud: (id) => api.put(`/solicitudes/${id}/rechazar`),
  cancelarSolicitud: (id) => api.delete(`/solicitudes/${id}/cancelar`),

  // Mensajes
  enviarMensaje: (id_solicitud, contenido) =>
    api.post(`/mensajes/solicitud/${id_solicitud}`, { contenido }),
  obtenerMensajes: (id_solicitud) =>
    api.get(`/mensajes/solicitud/${id_solicitud}`),
  obtenerConversaciones: () => api.get("/mensajes/conversaciones"),

  // Listas
  crearLista: (datos) => api.post("/listas", datos),
  obtenerMisListas: () => api.get("/listas"),
  obtenerLista: (id) => api.get(`/listas/${id}`),
  agregarProveedorALista: (id_lista, datos) =>
    api.post(`/listas/${id_lista}/proveedores`, datos),
  actualizarEstadoProveedor: (id_lista_proveedor, datos) =>
    api.put(`/listas/proveedores/${id_lista_proveedor}/estado`, datos),
  eliminarProveedorDeLista: (id_lista_proveedor) =>
    api.delete(`/listas/proveedores/${id_lista_proveedor}`),

  // Reseñas
  crearResena: (datos) => api.post("/resenas", datos),
  obtenerResenasProveedor: (id_proveedor, params) =>
    api.get(`/resenas/proveedor/${id_proveedor}`, { params }),

  // Promociones
  buscarPromociones: (params) => api.get("/promociones/buscar", { params }),

  //Lugares
};
