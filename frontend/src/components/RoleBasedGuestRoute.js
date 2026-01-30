import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RoleBasedGuestRoute({ children, allowedFor = 'both', blockProveedores = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  // Si blockProveedores está activo (para Home)
  if (blockProveedores && user && user.rol === 'proveedor') {
    return <Navigate to="/proveedor/cuenta/informacion" />;
  }

  // Si el usuario está autenticado
  if (user) {
    // Si es cliente tratando de acceder a rutas de proveedor (login-proveedor, register-proveedor)
    if (user.rol === 'cliente' && allowedFor === 'proveedor') {
      return <Navigate to="/" />;
    }
    
    // Si es proveedor tratando de acceder a rutas de cliente (login, register)
    if (user.rol === 'proveedor' && allowedFor === 'cliente') {
      return <Navigate to="/proveedor/cuenta/informacion" />;
    }

    // Si ya está autenticado y está en login/register genérico, redirigir según rol
    // SOLO si NO es la ruta Home (que tiene blockProveedores en vez de allowedFor)
    if (!blockProveedores) {
      if (user.rol === 'cliente' && allowedFor === 'cliente') {
        return <Navigate to="/" />;
      } else if (user.rol === 'proveedor' && allowedFor === 'proveedor') {
        return <Navigate to="/proveedor/cuenta/informacion" />;
      }
    }
  }

  // Si no está autenticado o es cliente en Home, mostrar la página
  return children;
}

export default RoleBasedGuestRoute;