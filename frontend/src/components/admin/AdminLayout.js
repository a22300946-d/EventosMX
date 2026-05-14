import React from 'react';
import Layout from '../Layout';
import SidebarAdmin from './SidebarAdmin';
import './AdminLayout.css';

function AdminLayout({ children }) {
  return (
    <Layout>
      <div className="admin-layout">
        <SidebarAdmin />
        <div className="admin-content">
          {children}
        </div>
      </div>
    </Layout>
  );
}

export default AdminLayout;