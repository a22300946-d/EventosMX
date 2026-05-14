import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Sin sesión: redirigir al login correcto según la ruta que intentaba visitar
  if (!user) {
    if (requiredRole === 'proveedor' || requiredRole === 'admin') {
      return <Navigate to="/login-proveedor" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Tiene sesión pero con rol incorrecto para esta ruta
  if (requiredRole && user.rol !== requiredRole) {
    if (user.rol === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.rol === 'proveedor') {
      return <Navigate to="/proveedor/cuenta/informacion" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;