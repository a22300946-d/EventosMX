import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        // Si no tiene rol, la sesión es inválida — limpiar
        if (!parsed.rol) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        } else {
          setUser(parsed);
        }
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (correo, contrasena, tipo) => {
    try {
      let endpoint;
      if (tipo === 'cliente') {
        endpoint = '/clientes/login';
      } else if (tipo === 'proveedor') {
        endpoint = '/proveedores/login';
      } else if (tipo === 'admin') {
        endpoint = '/admin/login';
      }

      const response = await api.post(endpoint, { correo, contrasena });

      const { token } = response.data.data;

      // El campo del usuario varía según el tipo
      let userData;
      if (tipo === 'admin') {
        userData = { ...response.data.data.admin, rol: 'admin' };
      } else {
        userData = { ...response.data.data[tipo], rol: tipo };
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (datos, tipo) => {
    try {
      const endpoint = tipo === 'cliente' ? '/clientes/registro' : '/proveedores/registro';
      await api.post(endpoint, datos);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al registrarse'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};