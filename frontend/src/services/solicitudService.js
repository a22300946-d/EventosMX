import axios from 'axios';

const API_URL = 'http://localhost:5000/api/solicitudes';

// Obtener token del localStorage
const getToken = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) return user.token;
    } catch (e) {}
  }
  return localStorage.getItem('token');
};

const getConfig = () => {
  const token = getToken();
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const solicitudService = {
  aprobar: async (id_solicitud) => {
    const response = await axios.put(
      `${API_URL}/${id_solicitud}/aceptar`,
      {},
      getConfig()
    );
    return response.data;
  },

  rechazar: async (id_solicitud) => {
    const response = await axios.put(
      `${API_URL}/${id_solicitud}/rechazar`,
      {},
      getConfig()
    );
    return response.data;
  },

  marcarComoRespondida: async (id_solicitud, propuesta) => {
    // Construir el body esperado por el backend
    const body = {
      mensaje_respuesta: propuesta.descripcion || 'Propuesta enviada',
      precio_propuesto: parseFloat(propuesta.precio),
      detalles_servicio: propuesta.descripcion || '',
      fecha_disponible: propuesta.fecha_servicio || null
    };

    const response = await axios.put(
      `${API_URL}/${id_solicitud}/responder`,
      body,
      getConfig()
    );
    return response.data;
  }
};

export default solicitudService;