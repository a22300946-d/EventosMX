import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";
import ProveedorLayout from "../../components/proveedor/ProveedorLayout";
import { proveedorService } from "../../services/proveedorService";
import "./CalendarioDisponibilidad.css";

// ─── Modal de notificación ────────────────────────────────────────────────────
function NotificacionModal({ modal, onClose }) {
  if (!modal.visible) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-contenido ${modal.tipo}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-icono">
          {modal.tipo === "exito" ? (
            <FaCheckCircle size={40} />
          ) : (
            <FaTimesCircle size={40} />
          )}
        </div>
        <h3 className="modal-titulo">
          {modal.tipo === "exito" ? "¡Listo!" : "Algo salió mal"}
        </h3>
        <p className="modal-mensaje">{modal.mensaje}</p>
        <button className="modal-btn-cerrar" onClick={onClose}>
          Aceptar
        </button>
        <button className="modal-btn-x" onClick={onClose} aria-label="Cerrar">
          <FaTimes size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function CalendarioDisponibilidad() {
  const [mesCalendario, setMesCalendario] = useState(new Date());
  const [fechasBloqueadas, setFechasBloqueadas] = useState([]);
  const [fechasBloqueadasTemp, setFechasBloqueadasTemp] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [modal, setModal] = useState({ visible: false, tipo: "exito", mensaje: "" });

  const mostrarModal = (tipo, mensaje) =>
    setModal({ visible: true, tipo, mensaje });

  const cerrarModal = () =>
    setModal((prev) => ({ ...prev, visible: false }));

  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
  ];

  const diasSemana = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

  useEffect(() => {
    cargarFechasBloqueadas();
  }, [mesCalendario]);

  const cargarFechasBloqueadas = async () => {
    try {
      setLoading(true);
      const year = mesCalendario.getFullYear();
      const month = mesCalendario.getMonth();
      const fechaInicio = new Date(year, month, 1).toISOString().split("T")[0];
      const fechaFin = new Date(year, month + 12, 0).toISOString().split("T")[0];

      const response = await proveedorService.obtenerMiCalendario({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
      });

      const bloqueadas = response.data.data
        .filter((fecha) => fecha.disponible === false)
        .map((fecha) => {
          let fechaStr = fecha.fecha;
          if (typeof fechaStr === "string" && fechaStr.includes("T")) {
            fechaStr = fechaStr.split("T")[0];
          } else if (fechaStr instanceof Date) {
            fechaStr = fechaStr.toISOString().split("T")[0];
          }
          return fechaStr;
        });

      setFechasBloqueadas(bloqueadas);
      if (!modoEdicion) {
        setFechasBloqueadasTemp(bloqueadas);
      }
    } catch (error) {
      setFechasBloqueadas([]);
    } finally {
      setLoading(false);
    }
  };

  const cambiarMesCalendario = (incremento) => {
    const nuevaFecha = new Date(mesCalendario);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + incremento);
    setMesCalendario(nuevaFecha);
  };

  const esFechaBloqueada = (fechaStr) => {
    const fechasAVerificar = modoEdicion ? fechasBloqueadasTemp : fechasBloqueadas;
    return fechasAVerificar.includes(fechaStr);
  };

  const esFechaPasada = (year, month, day) => {
    const fecha = new Date(year, month, day);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha <= hoy;
  };

  const toggleDiaEdicion = (dia) => {
    if (!modoEdicion) return;
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();
    const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia
      .toString()
      .padStart(2, "0")}`;

    if (fechasBloqueadasTemp.includes(fechaStr)) {
      setFechasBloqueadasTemp(fechasBloqueadasTemp.filter((f) => f !== fechaStr));
    } else {
      setFechasBloqueadasTemp([...fechasBloqueadasTemp, fechaStr]);
    }
  };

  const handleActivarEdicion = () => {
    setModoEdicion(true);
    setFechasBloqueadasTemp([...fechasBloqueadas]);
  };

  const handleGuardarCambios = async () => {
    try {
      setLoading(true);
      const fechasABloquear = fechasBloqueadasTemp.filter(
        (fecha) => !fechasBloqueadas.includes(fecha)
      );
      const fechasALiberar = fechasBloqueadas.filter(
        (fecha) => !fechasBloqueadasTemp.includes(fecha)
      );

      for (const fecha of fechasABloquear) {
        await proveedorService.bloquearFecha(fecha, "No disponible");
      }
      for (const fecha of fechasALiberar) {
        await proveedorService.liberarFecha(fecha);
      }

      setFechasBloqueadas([...fechasBloqueadasTemp]);
      setModoEdicion(false);
      mostrarModal("exito", "Los cambios se guardaron exitosamente.");
    } catch (error) {
      mostrarModal("error", "Error al guardar los cambios. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarEdicion = () => {
    setFechasBloqueadasTemp([...fechasBloqueadas]);
    setModoEdicion(false);
  };

  const renderCalendario = () => {
    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasMes = [];
    const primerDiaSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;

    for (let i = 0; i < primerDiaSemana; i++) {
      diasMes.push(<div key={`empty-${i}`} className="calendario-dia vacio"></div>);
    }

    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      const fechaStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
      const bloqueado = esFechaBloqueada(fechaStr);
      const pasado = esFechaPasada(year, month, dia);

      diasMes.push(
        <div
          key={dia}
          className={`calendario-dia${bloqueado ? " bloqueado" : ""}${pasado ? " pasado" : ""}${modoEdicion ? " editable" : ""}`}
          onClick={() => !pasado && toggleDiaEdicion(dia)}
          style={{ cursor: modoEdicion && !pasado ? "pointer" : "default" }}
        >
          {dia}
        </div>
      );
    }

    return diasMes;
  };

  return (
    <ProveedorLayout>
      <div className="calendario-container">
        <h1>Mi calendario</h1>

        {modoEdicion && (
          <div className="alerta-edicion">
            Modo edición activado — Haz clic en los días para bloquear/desbloquear
          </div>
        )}

        <div className="calendario-card">
          <div className="calendario-header">
            <button
              onClick={() => cambiarMesCalendario(-1)}
              className="btn-mes"
              aria-label="Mes anterior"
            >
              <FaChevronLeft />
            </button>
            <h2>
              {meses[mesCalendario.getMonth()]} {mesCalendario.getFullYear()}
            </h2>
            <button
              onClick={() => cambiarMesCalendario(1)}
              className="btn-mes"
              aria-label="Mes siguiente"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="calendario-semana">
            {diasSemana.map((dia) => (
              <div key={dia} className="calendario-dia-semana">
                {dia}
              </div>
            ))}
          </div>

          <div className="calendario-grid">
            {loading ? (
              <div className="calendario-loading">Cargando...</div>
            ) : (
              renderCalendario()
            )}
          </div>

          {/* ✅ Leyenda de colores */}
          <div className="calendario-leyenda">
            <div className="leyenda-item">
              <div className="leyenda-color disponible"></div>
              <span>Disponible</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color bloqueado"></div>
              <span>No disponible</span>
            </div>
            <div className="leyenda-item">
              <div className="leyenda-color pasado"></div>
              <span>Fecha pasada</span>
            </div>
          </div>
        </div>

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
                Cancelar
              </button>
              <button
                className="btn-guardar"
                onClick={handleGuardarCambios}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      <NotificacionModal modal={modal} onClose={cerrarModal} />
    </ProveedorLayout>
  );
}

export default CalendarioDisponibilidad;