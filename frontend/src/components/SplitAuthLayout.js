import React from 'react';
import Layout from './Layout';
import './SplitAuthLayout.css';

function SplitAuthLayout({ 
  children, 
  title, 
  subtitle, 
  heroTitle, 
  backgroundImage 
}) {
  return (
    <Layout>
      <div className="split-container">
        {/* Lado izquierdo - Hero */}
        <div 
          className="split-hero"
          style={{ 
            backgroundImage: backgroundImage 
              ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`
              : 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80)'
          }}
        >
          <h1 className="hero-title">{heroTitle}</h1>
        </div>

        {/* Lado derecho - Formulario */}
        <div className="split-form">
          <div className="form-container">
            <h2 className="form-title">{title}</h2>
            {subtitle && <p className="form-subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default SplitAuthLayout;