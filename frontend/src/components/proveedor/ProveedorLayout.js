import React from 'react';
import Layout from '../Layout';
import SidebarProveedor from './SidebarProveedor';
import './ProveedorLayout.css';

function ProveedorLayout({ children }) {
  return (
    <Layout>
      <div className="proveedor-layout">
        <SidebarProveedor />
        <div className="proveedor-content">
          {children}
        </div>
      </div>
    </Layout>
  );
}

export default ProveedorLayout;