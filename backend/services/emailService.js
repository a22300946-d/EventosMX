/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centraliza todo el envío de correos con Nodemailer + Gmail.
 *
 * Firebase Admin genera los links de acción. El destino (continueUrl) ya NO
 * se pasa aquí — se configura una sola vez en Firebase Console como
 * "Customize action URL", así el link del correo lleva directo al frontend
 * sin pasar por las pantallas genéricas de firebaseapp.com.
 *
 * Métodos:
 *  - enviarVerificacion              → registro de cuenta
 *  - enviarRecuperacion              → reset de contraseña
 *  - enviarConfirmacionAcuerdo       → ambas partes al aceptar propuesta
 *  - enviarRecordatorioProveedor     → primer umbral de tiempo
 *  - enviarNotificacionSinRespuesta  → segundo umbral (aviso al cliente)
 */

const admin = require('../config/firebase.config');
const nodemailer = require('nodemailer');

// ── Transporte Gmail ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Helper: cabecera HTML común ──────────────────────────────────────────────
const headerHTML = `
  <div style="background:#1a4d5c;padding:20px;text-align:center;border-radius:10px 10px 0 0;">
    <h1 style="color:white;margin:0;font-family:Arial,sans-serif;">EventosMX</h1>
  </div>
`;

// ── Helper: tabla de detalles ────────────────────────────────────────────────
function tablaDetalles(filas) {
  const filasHTML = filas
    .map(([etiqueta, valor], i) => `
      <tr style="background:${i % 2 === 0 ? '#e8f4f8' : '#ffffff'};">
        <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">${etiqueta}</td>
        <td style="padding:10px;border:1px solid #ddd;">${valor}</td>
      </tr>
    `)
    .join('');

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-family:Arial,sans-serif;">
      ${filasHTML}
    </table>
  `;
}

// ── Helper: envolver en layout ───────────────────────────────────────────────
function layout(contenido) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      ${headerHTML}
      <div style="padding:30px;background:#f9f9f9;">
        ${contenido}
        <p style="margin-top:30px;color:#888;font-size:12px;">
          Este correo fue generado automáticamente por EventosMX.<br>
          Por favor no respondas a este correo.
        </p>
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────

class EmailService {

  // ── Verificación de correo ──────────────────────────────────────────────
  // El Action URL configurado en Firebase Console determina el destino.
  // Firebase añade ?mode=verifyEmail&oobCode=...&apiKey=... automáticamente.
  async enviarVerificacion({ email, nombre }) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const link = await admin.auth().generateEmailVerificationLink(email, { url: `${backendUrl}/api/auth/accion` });

    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Verifica tu correo - EventosMX',
      html: layout(`
        <h2>¡Hola ${nombre}!</h2>
        <p>Gracias por registrarte. Haz clic en el botón para verificar tu cuenta:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${link}"
             style="background:#1a4d5c;color:white;padding:15px 30px;
                    text-decoration:none;border-radius:5px;font-size:16px;">
            Verificar mi correo
          </a>
        </div>
        <p style="color:#888;font-size:12px;">Este enlace expira en 24 horas.</p>
      `),
    });

    console.log(`✅ Correo de verificación enviado a: ${email}`);
    return { success: true };
  }

  // ── Recuperación de contraseña ──────────────────────────────────────────
  // El Action URL configurado en Firebase Console determina el destino.
  // Firebase añade ?mode=resetPassword&oobCode=...&apiKey=... automáticamente.
  async enviarRecuperacion({ email }) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const link = await admin.auth().generatePasswordResetLink(email, { url: `${backendUrl}/api/auth/accion` });

    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Recupera tu contraseña - EventosMX',
      html: layout(`
        <h2>Recupera tu contraseña</h2>
        <p>Haz clic en el botón para crear una nueva contraseña:</p>
        <div style="text-align:center;margin:30px 0;">
          <a href="${link}"
             style="background:#1a4d5c;color:white;padding:15px 30px;
                    text-decoration:none;border-radius:5px;font-size:16px;">
            Recuperar contraseña
          </a>
        </div>
        <p style="color:#888;font-size:12px;">Si no solicitaste esto, ignora este correo.</p>
      `),
    });

    console.log(`✅ Correo de recuperación enviado a: ${email}`);
    return { success: true };
  }

  // ── Confirmación simultánea al aceptar propuesta ────────────────────────
  async enviarConfirmacionAcuerdo({ cliente, proveedor, detalles }) {
    const tabla = tablaDetalles([
      ['Tipo de servicio / evento', detalles.servicio],
      ['Fecha del evento',          detalles.fecha],
      ['Precio acordado',           `$${Number(detalles.precio).toLocaleString('es-MX')}`],
      ...(detalles.descripcion
        ? [['Detalles adicionales', detalles.descripcion]]
        : []),
    ]);

    const mailCliente = transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: cliente.correo,
      subject: '🎉 ¡Acuerdo confirmado! - EventosMX',
      html: layout(`
        <h2>¡Hola ${cliente.nombre_completo}!</h2>
        <p>
          Tu acuerdo con <strong>${proveedor.nombre_negocio}</strong> ha sido
          confirmado. Aquí tienes el resumen:
        </p>
        ${tabla}
        <p style="margin-top:20px;">
          El proveedor se pondrá en contacto contigo próximamente para coordinar
          los últimos detalles. ¡Gracias por usar EventosMX!
        </p>
      `),
    });

    const mailProveedor = transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: proveedor.correo,
      subject: '🎊 ¡Nuevo acuerdo confirmado! - EventosMX',
      html: layout(`
        <h2>¡Hola ${proveedor.nombre_negocio}!</h2>
        <p>
          <strong>${cliente.nombre_completo}</strong> ha aceptado tu propuesta.
          Resumen del acuerdo:
        </p>
        ${tabla}
        <p style="margin-top:20px;">
          Recuerda contactar al cliente para coordinar los detalles finales.
          ¡Felicidades por tu nuevo cliente!
        </p>
      `),
    });

    await Promise.all([mailCliente, mailProveedor]);
    console.log(`✅ Correos de confirmación enviados → cliente: ${cliente.correo} | proveedor: ${proveedor.correo}`);
    return { success: true };
  }

  // ── Recordatorio automático al PROVEEDOR (1er umbral) ──────────────────
  async enviarRecordatorioProveedor({ proveedor, cliente, solicitud }) {
    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: proveedor.correo,
      subject: '⏰ Tienes una solicitud pendiente de respuesta - EventosMX',
      html: layout(`
        <h2>¡Hola ${proveedor.nombre_negocio}!</h2>
        <p>
          Tienes una solicitud de <strong>${cliente.nombre_completo}</strong>
          que lleva <strong>${solicitud.horas_espera} horas</strong> esperando
          tu respuesta.
        </p>
        ${tablaDetalles([
          ['Solicitud #',     solicitud.id],
          ['Tipo de evento',  solicitud.tipo_evento],
          ['Fecha del evento',solicitud.fecha_evento],
        ])}
        <p style="margin-top:20px;">
          Responde cuanto antes para no perder este cliente. Ingresa a tu panel
          en EventosMX para enviar tu propuesta.
        </p>
        <div style="text-align:center;margin:25px 0;">
          <a href="${process.env.FRONTEND_URL}/proveedor/solicitudes"
             style="background:#1a4d5c;color:white;padding:12px 28px;
                    text-decoration:none;border-radius:5px;font-size:15px;">
            Ver solicitud
          </a>
        </div>
      `),
    });

    console.log(`📧 Recordatorio enviado a proveedor: ${proveedor.correo} (solicitud #${solicitud.id})`);
    return { success: true };
  }

  // ── Notificación al CLIENTE de falta de respuesta (2do umbral) ─────────
  async enviarNotificacionSinRespuesta({ cliente, proveedor, solicitud }) {
    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: cliente.correo,
      subject: '📭 El proveedor aún no ha respondido tu solicitud - EventosMX',
      html: layout(`
        <h2>¡Hola ${cliente.nombre_completo}!</h2>
        <p>
          Tu solicitud enviada a <strong>${proveedor.nombre_negocio}</strong>
          lleva <strong>${solicitud.horas_espera} horas</strong> sin respuesta.
        </p>
        ${tablaDetalles([
          ['Solicitud #',     solicitud.id],
          ['Tipo de evento',  solicitud.tipo_evento],
          ['Fecha del evento',solicitud.fecha_evento],
        ])}
        <p style="margin-top:20px;">
          Puedes cancelar esta solicitud y buscar otro proveedor disponible
          en la plataforma.
        </p>
        <div style="text-align:center;margin:25px 0;">
          <a href="${process.env.FRONTEND_URL}/cliente/solicitudes"
             style="background:#c0392b;color:white;padding:12px 28px;
                    text-decoration:none;border-radius:5px;font-size:15px;">
            Ver mis solicitudes
          </a>
        </div>
        <p style="font-size:13px;color:#555;">
          Si prefieres esperar, no necesitas hacer nada. Te seguiremos
          notificando si hay cambios.
        </p>
      `),
    });

    console.log(`📧 Notificación sin-respuesta enviada a cliente: ${cliente.correo} (solicitud #${solicitud.id})`);
    return { success: true };
  }

  // ── Métodos legacy (compatibilidad hacia atrás) ─────────────────────────
  /** @deprecated Usa enviarConfirmacionAcuerdo en su lugar */
  async enviarAcuerdoCliente({ cliente, proveedor, detalles }) {
    return this.enviarConfirmacionAcuerdo({ cliente, proveedor, detalles });
  }

  /** @deprecated Usa enviarConfirmacionAcuerdo en su lugar */
  async enviarAcuerdoProveedor({ cliente, proveedor, detalles }) {
    return this.enviarConfirmacionAcuerdo({ cliente, proveedor, detalles });
  }
}

module.exports = new EmailService();