import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarCliente.css';

function SidebarCliente() {
  const location = useLocation();

  const menuItems = [
    { path: '/cliente/cuenta/datos', label: 'Mis datos' },
    { path: '/cliente/cuenta/preferencias', label: 'Preferencias' },
    { path: '/cliente/cuenta/listas', label: 'Mis listas' },
    { path: '/cliente/cuenta/historial', label: 'Historial de búsquedas' },
    { path: '/cliente/cuenta/resenas', label: 'Reseñas publicadas' }
  ];

  return (
    <aside className="sidebar-cliente">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

export default SidebarCliente;