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

  if (!user) {
    if (requiredRole === 'proveedor') {
      return <Navigate to="/login-proveedor" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.rol !== requiredRole) {
    if (user.rol === 'proveedor') {
      return <Navigate to="/proveedor/cuenta/informacion" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}
export default ProtectedRoute;