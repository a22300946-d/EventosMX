import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SplitAuthLayout from '../components/SplitAuthLayout';

function LoginProveedor() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(correo, contrasena, 'proveedor');

    if (result.success) {
      navigate('/proveedor/cuenta/informacion');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <SplitAuthLayout
      title="Accede a tu Negocio"
      subtitle="Completa el formulario con los datos de tu cuenta"
      heroTitle="TU NEGOCIO DE EVENTOS, A OTRO NIVEL"
    >
      <div className="form-link" style={{ marginBottom: '1rem' }}>
        ¿Aún no tienes una cuenta?{' '}
        <Link to="/register-proveedor">Regístrate</Link>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input
            type="email"
            className="form-input"
            placeholder="Email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            className="form-input"
            placeholder="Contraseña"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Accediendo...' : 'Acceder'}
        </button>
      </form>

      <div className="form-link" style={{ marginTop: '1rem' }}>
        <Link to="/forgot-password">Olvidé mi contraseña</Link>
      </div>

      <div className="form-divider">¿Eres cliente?</div>

      <div className="form-link">
        <Link to="/login">Acceso para clientes</Link>
      </div>
    </SplitAuthLayout>
  );
}

export default LoginProveedor;