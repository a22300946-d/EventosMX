const express = require('express');
const router  = express.Router();
const admin   = require('../config/firebase.config');
const bcrypt  = require('bcrypt');
const pool    = require('../config/database');

/**
 * GET /api/auth/accion
 * ─────────────────────────────────────────────────────────────────────────────
 * Punto de entrada único para los links de acción de Firebase.
 * Firebase Action URL apunta aquí: http://localhost:5000/api/auth/accion
 *
 * - verifyEmail   → backend verifica con Firebase y redirige al frontend
 * - resetPassword → redirige al frontend con oobCode intacto para capturar
 *                   la nueva contraseña
 */
router.get('/accion', async (req, res) => {
  const { mode, oobCode, apiKey } = req.query;
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';

  if (!oobCode || !mode) {
    return res.redirect(`${FRONTEND}/verificar-correo?error=ENLACE_INVALIDO`);
  }

  // ── Reset de contraseña: redirigir al frontend con los params intactos ──
  if (mode === 'resetPassword') {
    return res.redirect(
      `${FRONTEND}/restablecer-contrasena?oobCode=${oobCode}&apiKey=${apiKey}`
    );
  }

  // ── Verificación de correo: procesar en el backend ──────────────────────
  if (mode === 'verifyEmail') {
    try {
      const firebaseRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oobCode }),
        }
      );
      const data = await firebaseRes.json();

      if (data.error) {
        const msg = data.error.message || 'ERROR_DESCONOCIDO';
        return res.redirect(`${FRONTEND}/verificar-correo?error=${msg}`);
      }

      return res.redirect(`${FRONTEND}/verificar-correo?exito=true`);
    } catch (err) {
      console.error('Error verificando correo:', err.message);
      return res.redirect(`${FRONTEND}/verificar-correo?error=ERROR_SERVIDOR`);
    }
  }

  return res.redirect(`${FRONTEND}/login`);
});

/**
 * POST /api/auth/actualizar-contrasena
 * ─────────────────────────────────────────────────────────────────────────────
 * Sincroniza la nueva contraseña en la base de datos después de que Firebase
 * la actualizó. Se llama desde RestablecerContrasena.js justo después de
 * confirmar el reset con Firebase REST API.
 *
 * Body: { correo, nuevaContrasena }
 *
 * Busca el correo en Cliente y Proveedor (en ese orden) y actualiza
 * la contraseña hasheada con bcrypt.
 */
router.post('/actualizar-contrasena', async (req, res) => {
  const { correo, nuevaContrasena } = req.body;

  if (!correo || !nuevaContrasena) {
    return res.status(400).json({
      success: false,
      message: 'Correo y nueva contraseña son requeridos'
    });
  }

  if (nuevaContrasena.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  try {
    const salt   = await bcrypt.genSalt(10);
    const hash   = await bcrypt.hash(nuevaContrasena, salt);

    // Intentar actualizar en Cliente
    const resCliente = await pool.query(
      `UPDATE Cliente SET contrasena = $1 WHERE correo = $2 RETURNING id_cliente`,
      [hash, correo]
    );

    if (resCliente.rows.length > 0) {
      console.log(`🔑 Contraseña actualizada para cliente: ${correo}`);
      return res.json({ success: true, rol: 'cliente' });
    }

    // Si no era cliente, intentar en Proveedor
    const resProveedor = await pool.query(
      `UPDATE Proveedor SET contrasena = $1 WHERE correo = $2 RETURNING id_proveedor`,
      [hash, correo]
    );

    if (resProveedor.rows.length > 0) {
      console.log(`🔑 Contraseña actualizada para proveedor: ${correo}`);
      return res.json({ success: true, rol: 'proveedor' });
    }

    // Intentar en Administrador también
    const resAdmin = await pool.query(
      `UPDATE Administrador SET contrasena = $1 WHERE correo = $2 RETURNING id_administrador`,
      [hash, correo]
    );

    if (resAdmin.rows.length > 0) {
      console.log(`🔑 Contraseña actualizada para administrador: ${correo}`);
      return res.json({ success: true, rol: 'admin' });
    }

    // Correo no encontrado en ninguna tabla — pero no revelar si existe
    // Respondemos éxito igualmente por seguridad
    return res.json({ success: true });

  } catch (err) {
    console.error('Error al actualizar contraseña en BD:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error interno al actualizar la contraseña'
    });
  }
});

module.exports = router;