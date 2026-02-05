const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send welcome coupon email
const sendCouponEmail = async (email, couponCode, discountValue) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Evara Store" <noreply@evara.com>',
      to: email,
      subject: '🎉 Welcome! Your 30% Off Coupon is Here!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Evara!</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .coupon-box {
              background: white;
              border: 2px dashed #667eea;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .coupon-code {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              letter-spacing: 2px;
              margin: 10px 0;
            }
            .discount-badge {
              background: #ff6b6b;
              color: white;
              padding: 10px 20px;
              border-radius: 25px;
              font-size: 18px;
              font-weight: bold;
              display: inline-block;
              margin: 10px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Welcome to Evara!</h1>
            <p>Your favorite fashion destination</p>
          </div>
          
          <div class="content">
            <h2>Here's Your Special Welcome Gift! 🎁</h2>
            <p>Thank you for joining us! As a special welcome, we're giving you <strong>${discountValue}% OFF</strong> on your first order.</p>
            
            <div class="coupon-box">
              <div class="discount-badge">${discountValue}% OFF</div>
              <p>Use this coupon code at checkout:</p>
              <div class="coupon-code">${couponCode}</div>
              <p><em>Valid for 7 days from now</em></p>
            </div>
            
            <h3>What You Get:</h3>
            <ul>
              <li>✅ ${discountValue}% discount on all categories</li>
              <li>✅ Valid for 7 days</li>
              <li>✅ No minimum order required</li>
              <li>✅ One-time use per customer</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="cta-button">
                Start Shopping Now →
              </a>
            </div>
            
            <p>Can't wait to see you shopping with us! 🛍️</p>
            
            <div class="footer">
              <p>This coupon was sent to ${email} because you recently registered on Evara.</p>
              <p>If you didn't create an account, please ignore this email.</p>
              <p>© 2024 Evara. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Welcome coupon email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending welcome coupon email:', error);
    throw error;
  }
};

// Send daily cart reminder email
const sendCartReminderEmail = async (email, userName, cartItems) => {
  try {
    const transporter = createTransporter();
    
    const cartItemsHtml = cartItems.map(item => `
      <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
        <h4>${item.name}</h4>
        <p>Price: ₹${item.price}</p>
        <p>Quantity: ${item.quantity}</p>
      </div>
    `).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Evara Store" <noreply@evara.com>',
      to: email,
      subject: '🛒 You have items in your cart!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Cart Reminder</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🛒 Don't Miss Out!</h1>
            <p>You have items waiting in your cart</p>
          </div>
          
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>You left some amazing items in your cart. Don't let them get away!</p>
            
            <h3>Your Cart Items:</h3>
            ${cartItemsHtml}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/cart" class="cta-button">
                Complete Your Order →
              </a>
            </div>
            
            <p>Items in your cart are selling fast. Complete your purchase before they're gone!</p>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Cart reminder email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending cart reminder email:', error);
    throw error;
  }
};

// Send product suggestions email
const sendProductSuggestionsEmail = async (email, userName, suggestedProducts) => {
  try {
    const transporter = createTransporter();
    
    const productsHtml = suggestedProducts.map(product => `
      <div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px;">
        <h4>${product.name}</h4>
        <p>Price: ₹${product.price}</p>
        <p>${product.description}</p>
      </div>
    `).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Evara Store" <noreply@evara.com>',
      to: email,
      subject: '✨ New Products You Might Love!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Product Suggestions</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 25px;
              font-weight: bold;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✨ Just For You!</h1>
            <p>Products we think you'll love</p>
          </div>
          
          <div class="content">
            <h2>Hi ${userName},</h2>
            <p>Based on your browsing history, we thought you might be interested in these new arrivals!</p>
            
            <h3>Recommended For You:</h3>
            ${productsHtml}
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/shop" class="cta-button">
                Shop Now →
              </a>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`Product suggestions email sent to ${email}`);
    
  } catch (error) {
    console.error('Error sending product suggestions email:', error);
    throw error;
  }
};

module.exports = {
  sendCouponEmail,
  sendCartReminderEmail,
  sendProductSuggestionsEmail
};
