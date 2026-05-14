import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SplitAuthLayout from '../components/SplitAuthLayout';
import PasswordInput from "../components/PasswordInput";

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

    // 1. Intentar como proveedor
    const resultProveedor = await login(correo, contrasena, 'proveedor');
    if (resultProveedor.success) {
      navigate('/proveedor/cuenta/informacion');
      setLoading(false);
      return;
    }

    // 2. Intentar como admin
    const resultAdmin = await login(correo, contrasena, 'admin');
    if (resultAdmin.success) {
      navigate('/admin/usuarios');
      setLoading(false);
      return;
    }

    // 3. Ambos fallaron — mostrar error y quedarse en la página
    setError('Correo o contraseña incorrectos');
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
          <PasswordInput
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
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