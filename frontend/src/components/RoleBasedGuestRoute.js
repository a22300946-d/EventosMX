import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function RoleBasedGuestRoute({ children, allowedFor = 'both', blockProveedores = false }) {
  const { user, loading } = useAuth();


  if (loading) {
    return <div>Cargando...</div>;
  }

  // --- CASO: ruta Home (blockProveedores=true) ---
  // Solo redirigir proveedores y admins que SÍ tienen sesión activa
  if (blockProveedores) {
    if (user && user.rol === 'proveedor') {
      return <Navigate to="/proveedor/cuenta/informacion" replace />;
    }
    if (user && user.rol === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    // cliente o sin sesión → mostrar Home
    return children;
  }

  // --- CASO: rutas de login/register ---
  // Si NO hay usuario, siempre mostrar la página (nunca redirigir)
  if (!user) {
    return children;
  }

  // Si HAY usuario, redirigir según su rol a su área
  if (user.rol === 'cliente') {
    if (allowedFor === 'cliente') {
      // ya está logueado como cliente, no necesita estar en login de cliente
      return <Navigate to="/" replace />;
    }
    if (allowedFor === 'proveedor') {
      // cliente intentando ir a login de proveedor
      return <Navigate to="/" replace />;
    }
  }

  if (user.rol === 'proveedor') {
    if (allowedFor === 'cliente') {
      return <Navigate to="/proveedor/cuenta/informacion" replace />;
    }
    if (allowedFor === 'proveedor') {
      return <Navigate to="/proveedor/cuenta/informacion" replace />;
    }
  }

  if (user.rol === 'admin') {
    // Admin autenticado intentando ir a cualquier login → su dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}

export default RoleBasedGuestRoute;