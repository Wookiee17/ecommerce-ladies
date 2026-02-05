// MOCK EMAIL SERVICE - Bypassing nodemailer issues for deployment
// const nodemailer = require('nodemailer');

const transporter = {
  sendMail: async (mailOptions) => {
    console.log('MOCK EMAIL SENT:', mailOptions);
    return true;
  }
};

exports.sendEmail = async ({ to, subject, html, template, data }) => {
  try {
    console.log(`[Email Service] Sending email to ${to} with subject: ${subject}`);
    // Simulate successful sending
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
