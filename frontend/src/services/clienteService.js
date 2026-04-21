import api from "./api";

export const clienteService = {
  // ========== PERFIL ==========
  obtenerPerfil: async () => {
    return await api.get("/clientes/perfil");
  },

  actualizarPerfil: async (datos) => {
    return await api.put("/clientes/perfil", datos);
  },

  // ========== SERVICIOS ==========
  buscarServicios: async (params) => {
    return await api.get("/servicios/buscar", { params });
  },

  obtenerServicio: async (id) => {
    return await api.get(`/servicios/${id}`);
  },

  // ========== CATEGORÍAS ==========
  obtenerCategorias: async () => {
    return await api.get("/categorias");
  },

  // ========== LUGARES ==========
  obtenerLugares: async () => {
    return await api.get("/lugares");
  },

  // ========== PROVEEDORES ==========
  buscarProveedores: async (params) => {
    return await api.get("/proveedores/buscar", { params });
  },

  obtenerProveedor: async (id) => {
    return await api.get(`/proveedores/publico/${id}`);
  },

// ========== LISTAS ==========
crearLista: async (datos) => {
  return await api.post('/listas', datos);
},

obtenerMisListas: async () => {
  return await api.get('/listas');
},

obtenerListaPorId: async (idLista) => {
  return await api.get(`/listas/${idLista}`);
},

actualizarLista: async (idLista, datos) => {
  return await api.put(`/listas/${idLista}`, datos);
},

eliminarLista: async (idLista) => {
  return await api.delete(`/listas/${idLista}`);
},

 // ========== PROVEEDORES EN LISTAS ==========
agregarProveedorALista: async (idLista, idProveedor) => {
  return await api.post(`/listas/${idLista}/proveedores`, {
    id_proveedor: idProveedor,
  });
},

  cambiarEstadoProveedor: async (idListaProveedor, nuevoEstado) => {
    return await api.put(
      `/listas/proveedores/${idListaProveedor}/estado`,
      {
        estado: nuevoEstado,
      }
    );
  },

  eliminarProveedorDeLista: async (idListaProveedor) => {
    return await api.delete(`/listas/proveedores/${idListaProveedor}`);
  },

// ========== FAVORITOS (usando listas) ==========
  obtenerListaFavoritos: async () => {
    return await api.get("/listas/favoritos");
  },

  agregarAFavoritos: async (idProveedor) => {
    return await api.post("/listas/favoritos/proveedores", {
      id_proveedor: idProveedor,
    });
  },

  eliminarDeFavoritos: async (idListaProveedor) => {
    return await api.delete(`/listas/favoritos/proveedores/${idListaProveedor}`);
  },

  verificarSiEsFavorito: async (idProveedor) => {
    return await api.get(`/listas/favoritos/verificar/${idProveedor}`);
  },

  // ========== SOLICITUDES ==========
  obtenerMisSolicitudes: async (params) => {
    return await api.get("/solicitudes/mis-solicitudes", { params });
  },

  obtenerSolicitud: async (id) => {
    return await api.get(`/solicitudes/${id}`);
  },

  crearSolicitud: async (datos) => {
    return await api.post("/solicitudes", datos);
  },

  aceptarSolicitud: async (id) => {
    return await api.put(`/solicitudes/${id}/aceptar`);
  },

  rechazarSolicitud: async (id) => {
    return await api.put(`/solicitudes/${id}/rechazar`);
  },

  cancelarSolicitud: async (id) => {
    return await api.delete(`/solicitudes/${id}/cancelar`);
  },

  // ========== MENSAJES ==========
  enviarMensaje: async (id_solicitud, contenido) => {
    return await api.post(`/mensajes/solicitud/${id_solicitud}`, {
      contenido,
    });
  },

  obtenerMensajes: async (id_solicitud) => {
    return await api.get(`/mensajes/solicitud/${id_solicitud}`);
  },

  obtenerConversaciones: async () => {
    return await api.get("/mensajes/conversaciones");
  },

  // ========== RESEÑAS ==========
  crearResena: async (datos) => {
    return await api.post("/resenas", datos);
  },

  obtenerResenasProveedor: async (id_proveedor, params) => {
    return await api.get(`/resenas/proveedor/${id_proveedor}`, { params });
  },

  obtenerMisResenas: async () => {
    return await api.get("/resenas/mis-resenas");
  },

  // ========== PROMOCIONES ==========
  buscarPromociones: async (params) => {
    return await api.get("/promociones/buscar", { params });
  },
};