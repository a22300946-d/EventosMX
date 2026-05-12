import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Obtener token del localStorage
const getToken = () => {
  const userStr = localStorage.getItem('user');
  console.log('👤 Usuario en localStorage:', userStr ? 'EXISTE' : 'NO EXISTE');
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('👤 Usuario parseado:', {
        tiene_token: !!user.token,
        tipo: user.tipo,
        id: user.id
      });
      if (user.token) return user.token;
    } catch (e) {
      console.error('❌ Error al parsear usuario:', e);
    }
  }
  
  const tokenDirecto = localStorage.getItem('token');
  console.log('🔑 Token directo en localStorage:', tokenDirecto ? 'EXISTE' : 'NO EXISTE');
  return tokenDirecto;
};

// Obtener configuración con headers de autorización
const getConfig = () => {
  const token = getToken();
  console.log('🔑 Token obtenido para reseña:', token ? 'SI' : 'NO');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const resenaService = {
  // Crear nueva reseña
  crear: async (resenaData) => {
    console.log('📤 Enviando reseña:', resenaData);
    const response = await axios.post(
      `${API_URL}/resenas`,
      resenaData,
      getConfig()
    );
    console.log('✅ Respuesta del servidor:', response.data);
    return response.data; // Devolver solo data, no todo el response
  },

  // Obtener reseñas de un proveedor
  obtenerPorProveedor: async (id_proveedor, filtros = {}) => {
    const response = await axios.get(
      `${API_URL}/resenas/proveedor/${id_proveedor}`,
      { 
        params: filtros,
        ...getConfig()
      }
    );
    return response.data;
  },

  // Verificar si el cliente puede dejar reseña
  puedeResenar: async (id_solicitud) => {
    const response = await axios.get(
      `${API_URL}/resenas/puede-resenar/${id_solicitud}`,
      getConfig()
    );
    return response.data;
  },

  // Reportar una reseña
  reportar: async (id_resena, motivo) => {
    const response = await axios.post(
      `${API_URL}/resenas/${id_resena}/reportar`,
      { motivo },
      getConfig()
    );
    return response.data;
  },

  // Eliminar mi reseña
  eliminar: async (id_resena) => {
    const response = await axios.delete(
      `${API_URL}/resenas/${id_resena}`,
      getConfig()
    );
    return response.data;
  }
};

export { resenaService };