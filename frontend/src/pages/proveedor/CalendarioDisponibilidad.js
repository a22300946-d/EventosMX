import React, { useState, useEffect } from "react";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import "./CalendarioDisponibilidad.css";

function CalendarioDisponibilidad() {
  const [fechaActual, setFechaActual] = useState(new Date());
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [diasBloqueadosTemp, setDiasBloqueadosTemp] = useState([]); // ← AGREGAR: Estado temporal para edición
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false); // ← AGREGAR: Estado para modo edición

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const diasSemana = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  useEffect(() => {
    cargarCalendario();
  }, [fechaActual]);

  const cargarCalendario = async () => {
    try {
      setLoading(true);
      const year = fechaActual.getFullYear();
      const month = fechaActual.getMonth() + 1;

      const response = await proveedorService.obtenerMiCalendario({
        fecha_inicio: `${year}-${month.toString().padStart(2, "0")}-01`,
        fecha_fin: `${year}-${month.toString().padStart(2, "0")}-31`,
      });

      const bloqueados = response.data.data
        .filter((dia) => !dia.disponible)
        .map((dia) => new Date(dia.fecha).getDate());

      setDiasBloqueados(bloqueados);
      setDiasBloqueadosTemp(bloqueados); // ← AGREGAR: Sincronizar temporal
    } catch (error) {
      console.error("Error al cargar calendario:", error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMes = (incremento) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + incremento);
    setFechaActual(nuevaFecha);
  };

  // ← MODIFICAR: Función para toggle en modo edición (sin guardar inmediatamente)
  const toggleDiaEdicion = (dia) => {
    if (!modoEdicion) return; // Solo permitir cambios en modo edición

    if (diasBloqueadosTemp.includes(dia)) {
      setDiasBloqueadosTemp(diasBloqueadosTemp.filter((d) => d !== dia));
    } else {
      setDiasBloqueadosTemp([...diasBloqueadosTemp, dia]);
    }
  };

  // ← AGREGAR: Función para activar modo edición
  const handleActivarEdicion = () => {
    setModoEdicion(true);
    setDiasBloqueadosTemp([...diasBloqueados]); // Copiar estado actual a temporal
  };

  // ← AGREGAR: Función para guardar cambios
  const handleGuardarCambios = async () => {
    try {
      setLoading(true);

      const year = fechaActual.getFullYear();
      const month = fechaActual.getMonth() + 1;

      // Obtener todos los días del mes actual
      const ultimoDia = new Date(year, month, 0).getDate();
      const todosLosDias = Array.from({ length: ultimoDia }, (_, i) => i + 1);

      // Determinar qué días se bloquearon y cuáles se liberaron
      const diasABloquear = diasBloqueadosTemp.filter(
        (dia) => !diasBloqueados.includes(dia),
      );
      const diasALiberar = diasBloqueados.filter(
        (dia) => !diasBloqueadosTemp.includes(dia),
      );

      // Bloquear nuevas fechas
      for (const dia of diasABloquear) {
        const fecha = `${year}-${month.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
        await proveedorService.bloquearFecha(fecha, "No disponible");
      }

      // Liberar fechas desbloqueadas
      for (const dia of diasALiberar) {
        const fecha = `${year}-${month.toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
        await proveedorService.liberarFecha(fecha);
      }

      // Actualizar estado permanente
      setDiasBloqueados([...diasBloqueadosTemp]);
      setModoEdicion(false);
    } catch (error) {
      console.error("Error al guardar cambios:", error);
    } finally {
      setLoading(false);
    }
  };

  // ← AGREGAR: Función para cancelar edición
  const handleCancelarEdicion = () => {
    setDiasBloqueadosTemp([...diasBloqueados]); // Restaurar estado original
    setModoEdicion(false);
  };

  const renderCalendario = () => {
    const primerDia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth(),
      1,
    );
    const ultimoDia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() + 1,
      0,
    );

    const diasMes = [];
    const primerDiaSemana =
      primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

    // Días vacíos antes del primer día
    for (let i = 0; i < primerDiaSemana; i++) {
      diasMes.push(
        <div key={`empty-${i}`} className="calendario-dia vacio"></div>,
      );
    }

    // Días del mes - usar diasBloqueadosTemp en modo edición
    const diasAMostrar = modoEdicion ? diasBloqueadosTemp : diasBloqueados;

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const bloqueado = diasAMostrar.includes(dia);
      diasMes.push(
        <div
          key={dia}
          className={`calendario-dia ${bloqueado ? "bloqueado" : ""} ${modoEdicion ? "editable" : ""}`}
          onClick={() => toggleDiaEdicion(dia)}
          style={{ cursor: modoEdicion ? "pointer" : "default" }}
        >
          {dia}
        </div>,
      );
    }

    return diasMes;
  };

  return (
    <ProveedorLayout>
      <div className="calendario-container">
        <h1>Mi calendario</h1>

        {/* ← AGREGAR: Indicador de modo edición */}
        {modoEdicion && (
          <div className="alerta-edicion">
            Modo edición activado - Haz clic en los días para
            bloquear/desbloquear
          </div>
        )}

        <div className="calendario-card">
          <div className="calendario-header">
            <button
              onClick={() => cambiarMes(-1)}
              className="btn-mes"
              disabled={modoEdicion} // ← AGREGAR: Deshabilitar navegación en modo edición
            >
              &lt;
            </button>
            <h2>
              {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
            </h2>
            <button
              onClick={() => cambiarMes(1)}
              className="btn-mes"
              disabled={modoEdicion} // ← AGREGAR: Deshabilitar navegación en modo edición
            >
              &gt;
            </button>
          </div>

          <div className="calendario-semana">
            {diasSemana.map((dia) => (
              <div key={dia} className="calendario-dia-semana">
                {dia}
              </div>
            ))}
          </div>

          <div className="calendario-grid">{renderCalendario()}</div>
        </div>

        {/* ← MODIFICAR: Botones dinámicos según modo */}
        <div className="calendario-acciones">
          {!modoEdicion ? (
            <button
              className="btn-editar"
              onClick={handleActivarEdicion}
              disabled={loading}
            >
              Editar
            </button>
          ) : (
            <>
              <button
                className="btn-cancelar"
                onClick={handleCancelarEdicion}
                disabled={loading}
              >
                ✕ Cancelar
              </button>
              <button
                className="btn-guardar"
                onClick={handleGuardarCambios}
                disabled={loading}
              >
                {loading ? "Guardando..." : " Guardar"}
              </button>
            </>
          )}
        </div>
      </div>
    </ProveedorLayout>
  );
}

export default CalendarioDisponibilidad;
