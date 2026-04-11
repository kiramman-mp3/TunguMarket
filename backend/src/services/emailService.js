import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: process.env.EMAIL_PORT === '465', // true para 465, false para otros como 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Esto evita que el router/firewall bloquee la conexión si
    // no reconoce los certificados del servidor de Google
    rejectUnauthorized: false
  }
});

class EmailService {
  static async sendVerificationEmail(email, name, token) {
    const brandPrimary = '#fbbf24';
    const brandSecondary = '#1e3a8a';
    const brandLight = '#f8fafc';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TunguMarket" <907johan@gmail.com>',
      to: email,
      subject: `Código de verificación: ${token} - TunguMarket`,
      html: `
        <div style="background-color: ${brandLight}; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); border: 1px solid rgba(255,255,255,0.2);">
            
            <div style="background-color: ${brandSecondary}; padding: 30px; text-align: center;">
              <h1 style="color: ${brandPrimary}; margin: 0; font-size: 28px; letter-spacing: -1px;">TunguMarket</h1>
            </div>

            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: ${brandSecondary}; margin-bottom: 10px; font-size: 22px;">¡Hola, ${name}!</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Casi has terminado. Usa el siguiente código para verificar tu cuenta y empezar a comprar o vender productos locales.
              </p>

              <div style="background: #f1f5f9; border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 2px dashed #cbd5e1;">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: ${brandSecondary}; font-family: monospace;">${token}</span>
              </div>

              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">
                Este código expira en <strong>30 minutos</strong> por seguridad.
              </p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Si no creaste esta cuenta, puedes ignorar este mensaje.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetEmail(email, name, token) {
    const brandPrimary = '#fbbf24';
    const brandSecondary = '#1e3a8a';
    const brandLight = '#f8fafc';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TunguMarket" <907johan@gmail.com>',
      to: email,
      subject: `Código de recuperación: ${token} - TunguMarket`,
      html: `
        <div style="background-color: ${brandLight}; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
            
            <div style="background-color: ${brandSecondary}; padding: 30px; text-align: center;">
              <h1 style="color: ${brandPrimary}; margin: 0; font-size: 28px;">TunguMarket</h1>
            </div>

            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: ${brandSecondary}; margin-bottom: 20px;">Recuperación de contraseña</h2>
              <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
                Recibimos una solicitud para cambiar tu contraseña. Usa el siguiente código en la aplicación para restablecerla:
              </p>

              <div style="background: #f1f5f9; border-radius: 16px; padding: 25px; margin-bottom: 30px; border: 2px dashed #cbd5e1;">
                <span style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: ${brandSecondary}; font-family: monospace;">${token}</span>
              </div>

              <p style="color: #94a3b8; font-size: 14px; margin-bottom: 0;">
                Este código expira en <strong>1 hora</strong> por tu seguridad.
              </p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    return await transporter.sendMail(mailOptions);
  }

  static async sendNewSaleEmail(email, sellerName, productTitle, buyerName) {
    const brandPrimary = '#fbbf24';
    const brandSecondary = '#1e3a8a';
    const brandLight = '#f8fafc';

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TunguMarket" <907johan@gmail.com>',
      to: email,
      subject: `¡Nueva venta realizada! - ${productTitle}`,
      html: `
        <div style="background-color: ${brandLight}; padding: 40px 20px; font-family: 'Segoe UI', sans-serif;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <div style="background-color: ${brandSecondary}; padding: 30px; text-align: center;">
              <h1 style="color: ${brandPrimary}; margin: 0;">¡Nueva Venta!</h1>
            </div>
            <div style="padding: 40px 30px; text-align: center;">
              <h2 style="color: ${brandSecondary};">¡Felicidades ${sellerName}!</h2>
              <p>Has vendido <strong>${productTitle}</strong> a <strong>${buyerName}</strong>.</p>
              <p>Revisa tu sección de "Mis Ventas" en TunguMarket para gestionar el envío.</p>
            </div>
          </div>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  }

  static async sendOrderShippedEmail(email, buyerName, orderId) {
    const brandPrimary = '#fbbf24';
    const brandSecondary = '#1e3a8a';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TunguMarket" <907johan@gmail.com>',
      to: email,
      subject: `Tu pedido ha sido enviado - TunguMarket`,
      html: `
        <div style="padding: 40px; font-family: sans-serif;">
          <h2 style="color: ${brandSecondary};">¡Buenas noticias, ${buyerName}!</h2>
          <p>Tu pedido #${orderId} ha sido marcado como <strong>Enviado</strong> por el vendedor.</p>
          <p>¡Pronto lo tendrás en tus manos!</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  }

  static async sendPaymentConfirmedEmail(email, buyerName, orderId, total) {
    const brandSecondary = '#1e3a8a';
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"TunguMarket" <907johan@gmail.com>',
      to: email,
      subject: `Pago Confirmado - Orden #${orderId}`,
      html: `
        <div style="padding: 40px; font-family: sans-serif;">
          <h2 style="color: ${brandSecondary};">Pago Confirmado, ${buyerName}</h2>
          <p>Hemos validado tu pago por un total de <strong>$${total}</strong>.</p>
          <p>El vendedor ya puede proceder con el envío de tus productos.</p>
        </div>
      `,
    };
    return await transporter.sendMail(mailOptions);
  }
}

export default EmailService;
