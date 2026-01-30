import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function GuestRoute({ children, allowedFor = 'both' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si el usuario está autenticado
  if (user) {
    // Redirigir a su dashboard correspondiente
    if (user.rol === 'cliente') {
      return <Navigate to="/cliente/dashboard" />;
    } else if (user.rol === 'proveedor') {
      return <Navigate to="/proveedor/dashboard" />;
    }
  }

  // Si no está autenticado, mostrar la página
  return children;
}

export default GuestRoute;