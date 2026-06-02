import api from './api';

export const mensajeService = {
  async obtenerConversaciones() {
    try {
      const response = await api.get('/mensajes/conversaciones');
      return response.data;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  },

  async obtenerMensajes(id_solicitud) {
    try {
      const response = await api.get(`/mensajes/solicitud/${id_solicitud}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      throw error;
    }
  },

  async enviarMensaje(id_solicitud, contenido) {
    try {
      const response = await api.post(`/mensajes/solicitud/${id_solicitud}`, { contenido });
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  },

  async marcarComoLeidos(id_solicitud) {
    try {
      const response = await api.put(`/mensajes/solicitud/${id_solicitud}/leidos`, {});
      return response.data;
    } catch (error) {
      console.error('Error al marcar como leídos:', error);
      throw error;
    }
  },

  async contarNoLeidos() {
    try {
      const response = await api.get('/mensajes/no-leidos');
      return response.data;
    } catch (error) {
      console.error('Error al contar no leídos:', error);
      throw error;
    }
  }
};
