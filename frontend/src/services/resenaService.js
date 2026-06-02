import api from './api';

const resenaService = {
  crear: async (resenaData) => {
    const response = await api.post('/resenas', resenaData);
    return response.data;
  },

  obtenerPorProveedor: async (id_proveedor, filtros = {}) => {
    const response = await api.get(`/resenas/proveedor/${id_proveedor}`, { params: filtros });
    return response.data;
  },

  puedeResenar: async (id_solicitud) => {
    const response = await api.get(`/resenas/puede-resenar/${id_solicitud}`);
    return response.data;
  },

  reportar: async (id_resena, motivo) => {
    const response = await api.post(`/resenas/${id_resena}/reportar`, { motivo });
    return response.data;
  },

  eliminar: async (id_resena) => {
    const response = await api.delete(`/resenas/${id_resena}`);
    return response.data;
  }
};

export { resenaService };
