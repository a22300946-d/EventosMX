import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './SidebarAdmin.css';

function SidebarAdmin() {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/usuarios',     label: 'Registro usuarios' },
    { path: '/admin/proveedores',  label: 'Registro proveedores' },
    { path: '/admin/solicitudes',  label: 'Solicitudes proveedores' },
    { path: '/admin/resenas',      label: 'Moderar reseñas' },
    { path: '/admin/notificaciones', label: 'Notificaciones generales' },
    { path: '/admin/catalogos',    label: 'Gestión de catálogos' },
  ];

  return (
    <aside className="sidebar-admin">
      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`sidebar-admin-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </aside>
  );
}

export default SidebarAdmin;