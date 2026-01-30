import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarProveedor.css';

function SidebarProveedor() {
  const location = useLocation();

  const menuItems = [
    { path: '/proveedor/cuenta/informacion', label: 'Mi información' },
    { path: '/proveedor/cuenta/servicios', label: 'Servicios y precios' },
    { path: '/proveedor/cuenta/galeria', label: 'Galería de fotos' },
    { path: '/proveedor/cuenta/promociones', label: 'Promociones' },
    { path: '/proveedor/cuenta/calendario', label: 'Calendario de disponibilidad' },
    { path: '/proveedor/cuenta/solicitudes', label: 'Solicitudes recibidas' },
    { path: '/proveedor/cuenta/resenas', label: 'Reseñas y calificaciones' }
  ];

  return (
    <aside className="sidebar-proveedor">
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

export default SidebarProveedor;