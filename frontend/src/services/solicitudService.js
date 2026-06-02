import api from './api';

export const solicitudService = {
  aprobar: async (id_solicitud) => {
    const response = await api.put(`/solicitudes/${id_solicitud}/aceptar`, {});
    return response.data;
  },

  rechazar: async (id_solicitud) => {
    const response = await api.put(`/solicitudes/${id_solicitud}/rechazar`, {});
    return response.data;
  },

  marcarComoRespondida: async (id_solicitud, propuesta) => {
    const body = {
      mensaje_respuesta: propuesta.notas_adicionales || '',
      precio_propuesto: parseFloat(propuesta.precio),
      detalles_servicio: propuesta.descripcion || '',
      fecha_disponible: propuesta.fecha_servicio || null
    };
    const response = await api.put(`/solicitudes/${id_solicitud}/responder`, body);
    return response.data;
  }
};

export default solicitudService;
