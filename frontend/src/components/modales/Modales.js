import React from "react";
import { FaCheckCircle, FaCopy, FaExclamationTriangle } from "react-icons/fa";
import "./Modales.css";

export function ModalConfirm({ config, onConfirm, onCancel }) {
  if (!config) return null;
  const { title, message, confirmLabel = "Sí, eliminar" } = config;
  return (
    <div className="promo-confirm-overlay" onClick={onCancel}>
      <div className="promo-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="promo-confirm-icono">
          <FaExclamationTriangle />
        </div>
        <h3 className="promo-confirm-titulo">{title}</h3>
        <p className="promo-confirm-desc">{message}</p>
        <div className="promo-confirm-acciones">
          <button className="promo-confirm-btn-cancelar" onClick={onCancel}>
            Cancelar
          </button>
          <button className="promo-confirm-btn-eliminar" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ModalAlert({ config, onClose }) {
  if (!config) return null;
  const { title, message, type = "success" } = config;
  const iconMap = {
    success: <FaCheckCircle     style={{ color: "#1a4d5c" }} />,
    info:    <FaCopy            style={{ color: "#1a4d5c" }} />,
    error:   <FaExclamationTriangle style={{ color: "#dc3545" }} />,
  };
  return (
    <div className="promo-confirm-overlay" onClick={onClose}>
      <div className="promo-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="promo-confirm-icono">
          {iconMap[type] || iconMap.success}
        </div>
        <h3 className="promo-confirm-titulo">{title}</h3>
        <p className="promo-confirm-desc">{message}</p>
        <div className="promo-confirm-acciones">
          <button
            className="promo-confirm-btn-eliminar"
            onClick={onClose}
            style={{ background: type === "error" ? "#dc3545" : "#1a4d5c" }}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}