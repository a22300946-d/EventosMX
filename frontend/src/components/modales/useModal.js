import { useState } from "react";

export function useModal() {
  const [modalConfirm, setModalConfirm] = useState(null);
  const [modalAlert, setModalAlert]     = useState(null);

  const mostrarAlerta = (title, message, type = "success") =>
    setModalAlert({ title, message, type });

  const mostrarConfirmacion = ({ title, message, confirmLabel, onConfirm }) =>
    setModalConfirm({ title, message, confirmLabel, onConfirm });

  const cerrarConfirm = () => setModalConfirm(null);
  const cerrarAlert   = () => setModalAlert(null);

  return {
    modalConfirm,
    modalAlert,
    mostrarAlerta,
    mostrarConfirmacion,
    cerrarConfirm,
    cerrarAlert,
  };
}