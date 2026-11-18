import nodemailer from 'nodemailer';

/**
 * Universal Mail Sender
 * Supports HTTPS REST email delivery (Resend / Brevo) to bypass cloud host SMTP port blocks (e.g. Render Free Tier),
 * with fallback to Nodemailer Gmail SMTP for local development.
 *
 * @param {string} email - Destination email address
 * @param {string} title - Email Subject
 * @param {string} body - HTML body content
 */
export const mailSender = async (email, title, body) => {
  // 1. Resend HTTPS REST API (Port 443 - Never blocked on Render or cloud hosts)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    try {
      const fromEmail = process.env.RESEND_FROM || process.env.MAIL_FROM || 'The Road Eagle <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: title,
          html: body,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.message || `Resend API failed with status ${res.status}`);
      }
      console.log(`[MailSender:Resend] Email sent successfully to ${email}. ID:`, resData.id);
      return { messageId: resData.id, provider: 'resend' };
    } catch (err) {
      console.error(`[MailSender:Resend] Error:`, err.message);
      // Fall through to other transports
    }
  }

  // 2. Brevo HTTPS REST API (Port 443 - Never blocked on Render or cloud hosts)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim().length > 0) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || process.env.OWNER_EMAIL || 'gamedevelop06@gmail.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'The Road Eagle';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY.trim(),
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: title,
          htmlContent: body,
        }),
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(resData.message || `Brevo API failed with status ${res.status}`);
      }
      console.log(`[MailSender:Brevo] Email sent successfully to ${email}. ID:`, resData.messageId);
      return { messageId: resData.messageId, provider: 'brevo' };
    } catch (err) {
      console.error(`[MailSender:Brevo] Error:`, err.message);
      // Fall through to Nodemailer
    }
  }

  // 3. Nodemailer SMTP (Default for Localhost; note that Render Free Tier blocks ports 25, 465, and 587)
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER || 'testshuklaweb@gmail.com',
        pass: process.env.MAIL_PASS || 'eefthdwevglcsjdg',
      },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    });

    const info = await transporter.sendMail({
      from: `"The Road Eagle || Bike Rentals" <${process.env.MAIL_USER || 'testshuklaweb@gmail.com'}>`,
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(`[MailSender:SMTP] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MailSender:SMTP] Error sending email to ${email}:`, error.message);
    throw error;
  }
};

export default mailSender;
