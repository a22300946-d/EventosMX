import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaTwitter, FaFacebook, FaInstagram, FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import './Layout.css';

function Layout({ children, showNav = true }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dropdownRef = useRef(null);

  const hideAuthButtons =
    location.pathname === '/login' ||
    location.pathname === '/login-proveedor' ||
    location.pathname === '/register' ||
    location.pathname === '/register-proveedor';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Detectar cambio de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="layout">
      {showNav && (
        <nav className="navbar">
          <div className="navbar-content">
            <Link to="/" className="logo">EventosMX</Link>
            
            {/* ========== NAVBAR CLIENTE ========== */}
            {user && user.rol === 'cliente' && (
              <div className="nav-links">
                {/* Mostrar enlaces solo en desktop */}
                {!isMobile && (
                  <>
                    <Link to="/">Explorar Servicios</Link>
                    <Link to="/cliente/eventos">Mis eventos</Link>
                  </>
                )}
                
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button
                    className="nav-dropdown-trigger"
                    onClick={() => setShowDropdown(prev => !prev)}
                  >
                    Mi cuenta <FaChevronDown size={12} />
                  </button>
                  
                  {showDropdown && (
                    <div className="nav-dropdown-menu">
                      {/* Mostrar enlaces en móvil dentro del menú */}
                      {isMobile && (
                        <>
                          <Link 
                            to="/" 
                            className="dropdown-item"
                            onClick={() => setShowDropdown(false)}
                          >
                            Explorar Servicios
                          </Link>
                          <Link 
                            to="/cliente/eventos" 
                            className="dropdown-item"
                            onClick={() => setShowDropdown(false)}
                          >
                            Mis eventos
                          </Link>
                        </>
                      )}
                      
                      <Link 
                        to="/cliente/cuenta/datos" 
                        className="dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        Mi información
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item dropdown-logout"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========== NAVBAR PROVEEDOR ========== */}
            {user && user.rol === 'proveedor' && (
              <div className="nav-links">
                {/* Mostrar Chat y Solicitudes solo en desktop */}
                {!isMobile && (
                  <>
                    <Link to="/proveedor/chat">Chat</Link>
                    <Link to="/proveedor/cuenta/solicitudes">Solicitudes</Link>
                  </>
                )}
                
                <div className="nav-dropdown" ref={dropdownRef}>
                  <button
                    className="nav-dropdown-trigger"
                    onClick={() => setShowDropdown(prev => !prev)}
                  >
                    Mi cuenta <FaChevronDown size={12} />
                  </button>
                  
                  {showDropdown && (
                    <div className="nav-dropdown-menu">
                      {/* Mostrar Chat y Solicitudes en móvil dentro del menú */}
                      {isMobile && (
                        <>
                          <Link 
                            to="/proveedor/chat" 
                            className="dropdown-item"
                            onClick={() => setShowDropdown(false)}
                          >
                            Chat
                          </Link>
                          <Link 
                            to="/proveedor/cuenta/solicitudes" 
                            className="dropdown-item"
                            onClick={() => setShowDropdown(false)}
                          >
                            Solicitudes
                          </Link>
                        </>
                      )}
                      
                      <Link 
                        to="/proveedor/cuenta/informacion" 
                        className="dropdown-item"
                        onClick={() => setShowDropdown(false)}
                      >
                        Mi información
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="dropdown-item dropdown-logout"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!user && !hideAuthButtons && (
              <div className="nav-links">
                <Link to="/login">Iniciar Sesión</Link>
              </div>
            )}
          </div>
        </nav>
      )}

      <main className="main-content">
        {children}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-links">
            <Link to="/about">¿Quiénes somos?</Link>
            <Link to="/register-proveedor">Registro de Profesionales</Link>
            <Link to="/terms">Condiciones del servicio</Link>
          </div>

          <div className="footer-bottom">
            <div className="footer-brand">EventosMX</div>
            <div className="footer-social">
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>

          <div className="footer-copyright">
            2026. Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;