import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Configurar axios para incluir el token en todas las peticiones
const getAuthHeaders = () => {
  // El token puede estar:
  // 1. Dentro del objeto user.token
  // 2. Por separado en localStorage.getItem('token')
  
  let token = null;
  
  // Opción 1: Buscar dentro del objeto user
  const user = localStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      token = userData.token;
    } catch (error) {
      console.error('Error al parsear user:', error);
    }
  }
  
  // Opción 2: Si no está dentro de user, buscar por separado
  if (!token) {
    token = localStorage.getItem('token');
  }
  
  if (!token) {
    console.error('❌ No se encontró token en localStorage');
    return { headers: {} };
  }

  console.log('✅ Token encontrado:', token.substring(0, 30) + '...');
  
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const mensajeService = {
  // Obtener conversaciones activas
  async obtenerConversaciones() {
    try {
      const response = await axios.get(
        `${API_URL}/api/mensajes/conversaciones`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  },

  // Obtener mensajes de una conversación
  async obtenerMensajes(id_solicitud) {
    try {
      const response = await axios.get(
        `${API_URL}/api/mensajes/solicitud/${id_solicitud}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      throw error;
    }
  },

  // Enviar mensaje
  async enviarMensaje(id_solicitud, contenido) {
    try {
      const response = await axios.post(
        `${API_URL}/api/mensajes/solicitud/${id_solicitud}`,
        { contenido },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  },

  // Marcar como leído
  async marcarComoLeidos(id_solicitud) {
    try {
      const response = await axios.put(
        `${API_URL}/api/mensajes/solicitud/${id_solicitud}/leidos`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al marcar como leídos:', error);
      throw error;
    }
  },

  // Contar no leídos
  async contarNoLeidos() {
    try {
      const response = await axios.get(
        `${API_URL}/api/mensajes/no-leidos`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al contar no leídos:', error);
      throw error;
    }
  }
};