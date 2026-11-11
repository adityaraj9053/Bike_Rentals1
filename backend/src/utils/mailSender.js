import nodemailer from 'nodemailer';

/**
 * Send email using Nodemailer (StudyPro configuration)
 * @param {string} email - Destination email address
 * @param {string} title - Email Subject
 * @param {string} body - HTML body content
 */
export const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      auth: {
        user: process.env.MAIL_USER || 'testshuklaweb@gmail.com',
        pass: process.env.MAIL_PASS || 'eefthdwevglcsjdg',
      },
    });

    const info = await transporter.sendMail({
      from: `"The Road Eagle || Bike Rentals" <${process.env.MAIL_USER || 'testshuklaweb@gmail.com'}>`,
      to: `${email}`,
      subject: `${title}`,
      html: `${body}`,
    });

    console.log(`[MailSender] Email sent successfully to ${email}. MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[MailSender] Error sending email to ${email}:`, error.message);
    throw error;
  }
};

export default mailSender;
