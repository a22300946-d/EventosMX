import React, { useState, useEffect } from 'react';
import ProveedorLayout from '../../components/proveedor/ProveedorLayout';
import { proveedorService } from '../../services/proveedorService';
import './GaleriaFotos.css';

function GaleriaFotos() {
  const [fotos, setFotos] = useState([]);
  const [limite, setLimite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [urlNuevaFoto, setUrlNuevaFoto] = useState('');

  useEffect(() => {
    cargarGaleria();
    cargarLimite();
  }, []);

  const cargarGaleria = async () => {
    try {
      const response = await proveedorService.obtenerMiGaleria();
      setFotos(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar galería:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarLimite = async () => {
    try {
      const response = await proveedorService.obtenerInfoLimiteGaleria();
      setLimite(response.data.data);
    } catch (error) {
      console.error('Error al cargar límite:', error);
    }
  };

  const agregarFoto = async () => {
    if (!urlNuevaFoto.trim()) {
      alert('Por favor ingresa una URL válida');
      return;
    }

    try {
      await proveedorService.agregarFoto({ url_foto: urlNuevaFoto });
      setUrlNuevaFoto('');
      cargarGaleria();
      cargarLimite();
    } catch (error) {
      alert(error.response?.data?.message || 'Error al agregar foto');
    }
  };

  const eliminarFoto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      await proveedorService.eliminarFoto(id);
      cargarGaleria();
      cargarLimite();
    } catch (error) {
      alert('Error al eliminar foto');
    }
  };

  return (
    <ProveedorLayout>
      <div className="galeria-container">
        <h1>Mis fotos</h1>

        {limite && (
          <p className="limite-info">
            {limite.total_fotos} de {limite.limite_maximo} fotos
          </p>
        )}

        {loading ? (
          <p>Cargando galería...</p>
        ) : (
          <div className="galeria-grid">
            {fotos.map((foto) => (
              <div key={foto.id_foto} className="foto-card">
                <img src={foto.url_foto} alt="Foto de galería" />
                <button 
                  className="btn-eliminar-foto"
                  onClick={() => eliminarFoto(foto.id_foto)}
                >
                  ✕
                </button>
              </div>
            ))}

            {limite && limite.puede_agregar && (
              <div className="foto-placeholder">
                <div className="icono-placeholder">📷</div>
              </div>
            )}
          </div>
        )}

        {limite && limite.puede_agregar && (
          <div className="agregar-foto-section">
            <input
              type="text"
              className="form-input"
              placeholder="URL de la foto"
              value={urlNuevaFoto}
              onChange={(e) => setUrlNuevaFoto(e.target.value)}
            />
            <button className="btn-agregar" onClick={agregarFoto}>
              Agregar Foto
            </button>
          </div>
        )}

        {!limite?.puede_agregar && (
          <p className="limite-alcanzado">
            Has alcanzado el límite de {limite?.limite_maximo} fotos
          </p>
        )}

        <button className="btn-editar">Editar</button>
      </div>
    </ProveedorLayout>
  );
}

export default GaleriaFotos;