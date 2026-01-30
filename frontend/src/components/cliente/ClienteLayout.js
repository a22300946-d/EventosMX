import React from 'react';
import Layout from '../Layout';
import SidebarCliente from './SidebarCliente';
import './ClienteLayout.css';

function ClienteLayout({ children }) {
  return (
    <Layout>
      <div className="cliente-layout">
        <SidebarCliente />
        <div className="cliente-content">
          {children}
        </div>
      </div>
    </Layout>
  );
}

export default ClienteLayout;