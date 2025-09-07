const nodemailer = require('nodemailer');

// Email configuration - Fixed: createTransport (not createTransporter)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Additional Gmail-specific settings
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Currency Gift Store'}" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (customerEmail, orderDetails) => {
  const subject = `Order Confirmation - Order #${orderDetails.orderId}`;
  
  // Build custom images section
  let customImagesHtml = '';
  if (orderDetails.customImages && orderDetails.customImages.length > 0) {
    customImagesHtml = `
      <h3>📸 Custom Images for Your Order:</h3>
      <p>These are the images you uploaded for this order. Please review them carefully:</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
        ${orderDetails.customImages.map((imageUrl, index) => `
          <div style="text-align: center; border: 1px solid #ddd; padding: 10px; border-radius: 8px;">
            <img src="${imageUrl}" alt="Custom Image ${index + 1}" style="max-width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Image ${index + 1} of ${orderDetails.customImages.length}</p>
          </div>
        `).join('')}
      </div>
      <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
        <strong>📋 Important:</strong> Please review these images carefully. If you need any changes or have concerns, 
        please contact us immediately. We want to ensure your order is exactly what you expect!
      </p>
    `;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Thank you for your order! 🎉</h2>
      <p>Dear ${orderDetails.customerName},</p>
      <p>Your order has been confirmed and is being processed.</p>
      
      <h3 style="color: #333;">📋 Order Details:</h3>
      <ul style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <li><strong>Order ID:</strong> ${orderDetails.orderId}</li>
        <li><strong>Total Amount:</strong> ₹${orderDetails.totalAmount}</li>
        <li><strong>Order Date:</strong> ${new Date(orderDetails.orderDate).toLocaleDateString()}</li>
      </ul>
      
      <h3 style="color: #333;">📦 Items Ordered:</h3>
      <ul>
        ${orderDetails.items.map(item => `
          <li style="margin: 5px 0;">${item.productName} - Quantity: ${item.quantity} - Price: ₹${item.price}</li>
        `).join('')}
      </ul>
      
      ${customImagesHtml}
      
      <p>We'll send you another email when your order ships.</p>
      <p style="margin-top: 30px;">Thank you for shopping with us!</p>
      
      <p style="margin-top: 20px; color: #666;">
        Best regards,<br>
        <strong>Currency Gift Store Team</strong>
      </p>
    </div>
  `;

  return await sendEmail(customerEmail, subject, '', html);
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  const subject = 'Welcome to Currency Gift Store!';
  const html = `
    <h2>Welcome to Currency Gift Store!</h2>
    <p>Dear ${userName},</p>
    <p>Thank you for creating an account with us. We're excited to have you as part of our community!</p>
    
    <p>You can now:</p>
    <ul>
      <li>Browse our unique currency gift collection</li>
      <li>Save items to your wishlist</li>
      <li>Track your orders</li>
      <li>Enjoy exclusive member benefits</li>
    </ul>
    
    <p>Start shopping now and discover our amazing collection of currency gifts!</p>
    
    <p>Best regards,<br>Currency Gift Store Team</p>
  `;

  return await sendEmail(userEmail, subject, '', html);
};

// Send contact form notification
const sendContactNotification = async (contactData) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  const subject = `New Contact Form Submission from ${contactData.name}`;
  const html = `
    <h2>New Contact Form Submission</h2>
    
    <p><strong>Name:</strong> ${contactData.name}</p>
    <p><strong>Email:</strong> ${contactData.email}</p>
    <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
    <p><strong>Subject:</strong> ${contactData.subject || 'General Inquiry'}</p>
    
    <h3>Message:</h3>
    <p>${contactData.message}</p>
    
    <p><strong>Submitted on:</strong> ${new Date().toLocaleString()}</p>
  `;

  return await sendEmail(adminEmail, subject, '', html);
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendWelcomeEmail,
  sendContactNotification
};
