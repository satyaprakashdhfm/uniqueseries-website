const emailService = require('../config/email');
const whatsAppService = require('../config/whatsapp');
const QRCode = require('qrcode');

// Store QR code data temporarily
let currentQRCode = null;

// Send notification via email and/or WhatsApp
const sendNotification = async (req, res) => {
  try {
    const { 
      type, // 'email', 'whatsapp', or 'both'
      recipient, // email or phone number
      notificationType, // 'order_confirmation', 'welcome', 'order_status', 'custom'
      data // notification data
    } = req.body;

    const results = {};

    // Send Email
    if (type === 'email' || type === 'both') {
      let emailResult;
      
      switch (notificationType) {
        case 'order_confirmation':
          emailResult = await emailService.sendOrderConfirmationEmail(recipient, data);
          break;
        case 'welcome':
          emailResult = await emailService.sendWelcomeEmail(recipient, data.userName);
          break;
        case 'contact_notification':
          emailResult = await emailService.sendContactNotification(data);
          break;
        case 'custom':
          emailResult = await emailService.sendEmail(recipient, data.subject, data.text, data.html);
          break;
        default:
          emailResult = { success: false, error: 'Invalid notification type for email' };
      }
      
      results.email = emailResult;
    }

    // Send WhatsApp
    if (type === 'whatsapp' || type === 'both') {
      if (!whatsAppService.isClientReady()) {
        results.whatsapp = { 
          success: false, 
          error: 'WhatsApp client is not ready. Please scan QR code first.' 
        };
      } else {
        let whatsappResult;
        
        switch (notificationType) {
          case 'order_confirmation':
            whatsappResult = await whatsAppService.sendOrderConfirmation(recipient, data);
            break;
          case 'welcome':
            whatsappResult = await whatsAppService.sendWelcomeMessage(recipient, data.userName);
            break;
          case 'order_status':
            whatsappResult = await whatsAppService.sendOrderStatusUpdate(recipient, data, data.status);
            break;
          case 'custom':
            whatsappResult = await whatsAppService.sendMessage(recipient, data.message);
            break;
          default:
            whatsappResult = { success: false, error: 'Invalid notification type for WhatsApp' };
        }
        
        results.whatsapp = whatsappResult;
      }
    }

    res.json({
      success: true,
      message: 'Notification processed',
      results
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Get WhatsApp QR code for admin panel
const getWhatsAppQRCode = async (req, res) => {
  try {
    const qrCode = whatsAppService.getCurrentQRCode();
    const isReady = whatsAppService.isClientReady();
    const adminPhone = whatsAppService.getAdminPhone();

    if (isReady) {
      return res.json({
        success: true,
        isReady: true,
        adminPhone,
        message: 'WhatsApp is connected and ready'
      });
    }

    if (qrCode) {
      return res.json({
        success: true,
        qrCode,
        adminPhone,
        isReady: false,
        message: 'Scan QR code with WhatsApp on phone: 9392464563'
      });
    }

    // If no QR code and not ready, try to generate one
    try {
      const newQRCode = await whatsAppService.waitForQRCode(60000);
      res.json({
        success: true,
        qrCode: newQRCode,
        adminPhone,
        isReady: false,
        message: 'Scan QR code with WhatsApp on phone: 9392464563'
      });
    } catch (error) {
      res.json({
        success: false,
        message: 'WhatsApp is not initialized. Please initialize first.',
        adminPhone
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get WhatsApp QR code',
      error: error.message
    });
  }
};

// Get WhatsApp status
const getWhatsAppStatus = async (req, res) => {
  try {
    const isReady = whatsAppService.isClientReady();
    const adminPhone = whatsAppService.getAdminPhone();
    
    res.json({
      success: true,
      isReady,
      adminPhone,
      message: isReady ? 'WhatsApp is ready' : 'WhatsApp is not ready. Please scan QR code.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get WhatsApp status',
      error: error.message
    });
  }
};

// Initialize WhatsApp (admin only)
const initializeWhatsApp = async (req, res) => {
  try {
    if (whatsAppService.isClientReady()) {
      return res.json({
        success: true,
        message: 'WhatsApp is already initialized and ready'
      });
    }

    // This will show QR code in server console
    await whatsAppService.initialize();
    
    res.json({
      success: true,
      message: 'WhatsApp initialization started. Please check server console for QR code.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to initialize WhatsApp',
      error: error.message
    });
  }
};

// Test email
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const result = await emailService.sendEmail(
      email,
      'Test Email from Currency Gift Store',
      'This is a test email to verify email functionality is working correctly.',
      '<h2>Test Email</h2><p>This is a test email to verify email functionality is working correctly.</p>'
    );

    res.json({
      success: result.success,
      message: result.success ? 'Test email sent successfully' : 'Failed to send test email',
      details: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

// Test WhatsApp
const testWhatsApp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    if (!whatsAppService.isClientReady()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp client is not ready. Please scan QR code first.'
      });
    }

    const result = await whatsAppService.sendMessage(
      phoneNumber,
      '🧪 *Test Message*\n\nThis is a test message from Currency Gift Store to verify WhatsApp functionality is working correctly. ✅'
    );

    res.json({
      success: result.success,
      message: result.success ? 'Test WhatsApp message sent successfully' : 'Failed to send test message',
      details: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test WhatsApp message',
      error: error.message
    });
  }
};

module.exports = {
  sendNotification,
  getWhatsAppStatus,
  getWhatsAppQRCode,
  initializeWhatsApp,
  testEmail,
  testWhatsApp
};
