const admin = require('../config/firebase.config');
const nodemailer = require('nodemailer');

// Configurar transporte de correo con Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class EmailService {

  // ── Verificación de correo ──────────────────────────
  async enviarVerificacion({ email, nombre }) {
    const link = await admin.auth().generateEmailVerificationLink(email, {
      url: `${process.env.FRONTEND_URL}/login`,
      handleCodeInApp: false
    });

    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✅ Verifica tu correo - EventosMX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d5c; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EventosMX</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>¡Hola ${nombre}!</h2>
            <p>Gracias por registrarte. Haz clic en el botón para verificar tu cuenta:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background: #1a4d5c; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-size: 16px;">
                Verificar mi correo
              </a>
            </div>
            <p style="color: #888; font-size: 12px;">Este enlace expira en 24 horas.</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Correo de verificación enviado a: ${email}`);
    return { success: true };
  }

  // ── Recuperación de contraseña ──────────────────────
  async enviarRecuperacion({ email }) {
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: `${process.env.FRONTEND_URL}/login`
    });

    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔑 Recupera tu contraseña - EventosMX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d5c; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EventosMX</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Recupera tu contraseña</h2>
            <p>Haz clic en el botón para crear una nueva contraseña:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${link}" 
                 style="background: #1a4d5c; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-size: 16px;">
                Recuperar contraseña
              </a>
            </div>
            <p style="color: #888; font-size: 12px;">Si no solicitaste esto, ignora este correo.</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Correo de recuperación enviado a: ${email}`);
    return { success: true };
  }

  // ── Confirmación de acuerdo al CLIENTE ──────────────
  async enviarAcuerdoCliente({ cliente, proveedor, detalles }) {
    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: cliente.correo,
      subject: '🎉 Acuerdo confirmado - EventosMX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d5c; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EventosMX</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>¡Hola ${cliente.nombre_completo}!</h2>
            <p>Tu acuerdo con <strong>${proveedor.nombre_negocio}</strong> ha sido confirmado.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: #e8f4f8;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Servicio</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${detalles.servicio}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${detalles.fecha}</td>
              </tr>
              <tr style="background: #e8f4f8;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Precio</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${detalles.precio}</td>
              </tr>
            </table>
            <p style="margin-top: 20px;">¡Gracias por usar EventosMX!</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Correo de acuerdo enviado a cliente: ${cliente.correo}`);
    return { success: true };
  }

  // ── Confirmación de acuerdo al PROVEEDOR ────────────
  async enviarAcuerdoProveedor({ cliente, proveedor, detalles }) {
    await transporter.sendMail({
      from: `"EventosMX" <${process.env.EMAIL_USER}>`,
      to: proveedor.correo,
      subject: '🎊 Nuevo acuerdo recibido - EventosMX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a4d5c; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">EventosMX</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>¡Hola ${proveedor.nombre_negocio}!</h2>
            <p>Tienes un nuevo acuerdo con <strong>${cliente.nombre_completo}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr style="background: #e8f4f8;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Servicio</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${detalles.servicio}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Fecha</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">${detalles.fecha}</td>
              </tr>
              <tr style="background: #e8f4f8;">
                <td style="padding: 10px; border: 1px solid #ddd;"><strong>Precio</strong></td>
                <td style="padding: 10px; border: 1px solid #ddd;">$${detalles.precio}</td>
              </tr>
            </table>
            <p style="margin-top: 20px;">¡Felicidades por tu nuevo cliente!</p>
          </div>
        </div>
      `
    });

    console.log(`✅ Correo de acuerdo enviado a proveedor: ${proveedor.correo}`);
    return { success: true };
  }
}

module.exports = new EmailService();