const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

exports.sendEmail = async ({ to, subject, html, template, data }) => {
  try {
    const mailOptions = {
      from: `"Evara" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: html || getEmailTemplate(template, data)
    };
    
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

function getEmailTemplate(template, data) {
  const templates = {
    'order-confirmation': `
      <h2>Order Confirmed!</h2>
      <p>Order #: ${data.orderNumber}</p>
      <p>Total: ₹${data.total}</p>
      <p>Thank you for shopping with Evara!</p>
    `,
    'welcome': `
      <h2>Welcome to Evara!</h2>
      <p>Hi ${data.name},</p>
      <p>Thank you for joining Evara. Start exploring our collection today!</p>
    `,
    'seller-approved': `
      <h2>Seller Account Approved!</h2>
      <p>Hi ${data.name},</p>
      <p>Your seller account has been approved. You can now start uploading products.</p>
    `
  };
  return templates[template] || '<p>Hello from Evara!</p>';
}
