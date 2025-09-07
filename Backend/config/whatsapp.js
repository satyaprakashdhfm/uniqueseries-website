const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrGenerated = false;
    this.currentQRCode = null;
    this.qrCallbacks = [];
    this.adminPhone = '919392464563'; // Your WhatsApp number
  }

  // Initialize WhatsApp client
  async initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          name: 'currency-gift-store'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });

      // Event listeners
      this.client.on('qr', async (qr) => {
        try {
          // Generate QR code for web display
          this.currentQRCode = await QRCode.toDataURL(qr);
          
          // Also show in console for fallback
          if (!this.qrGenerated) {
            console.log('\n🔄 WhatsApp QR Code generated');
            console.log('📱 Open WhatsApp on phone number: 9392464563');
            console.log('📷 Tap "Linked Devices" and then "Link a Device"');
            console.log('📸 Scan the QR code in admin panel\n');
            
            qrcode.generate(qr, { small: true });
            
            console.log('\n⏳ Waiting for QR code scan...\n');
            this.qrGenerated = true;
          }

          // Notify any waiting callbacks
          this.qrCallbacks.forEach(callback => callback(this.currentQRCode));
          this.qrCallbacks = [];
          
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      });

      this.client.on('ready', () => {
        console.log('✅ WhatsApp client is ready for number: 9392464563');
        this.isReady = true;
        this.currentQRCode = null; // Clear QR code when connected
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp client authenticated successfully for number: 9392464563');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isReady = false;
      });

      this.client.on('disconnected', (reason) => {
        console.log('🔌 WhatsApp client disconnected:', reason);
        this.isReady = false;
      });

      // Initialize the client
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Error initializing WhatsApp client:', error);
      throw error;
    }
  }

  // Send a text message
  async sendMessage(phoneNumber, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready. Please scan the QR code first.');
      }

      // Format phone number (remove any non-digits and add country code if needed)
      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const chatId = `${formattedNumber}@c.us`;

      const response = await this.client.sendMessage(chatId, message);
      console.log(`✅ WhatsApp message sent to ${phoneNumber}`);
      return { success: true, messageId: response.id.id };
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return { success: false, error: error.message };
    }
  }

  // Format phone number to WhatsApp format
  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.substring(1);
    }
    
    return cleaned;
  }

  // Send order confirmation WhatsApp message
  async sendOrderConfirmation(phoneNumber, orderDetails) {
    const message = `🎉 *Order Confirmation* 

Hello ${orderDetails.customerName}!

Your order has been confirmed! 

📋 *Order Details:*
Order ID: ${orderDetails.orderId}
Total Amount: ₹${orderDetails.totalAmount}
Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}

📦 *Items Ordered:*
${orderDetails.items.map(item => `• ${item.productName} - Qty: ${item.quantity} - ₹${item.price}`).join('\n')}

We'll notify you when your order ships. Thank you for shopping with Currency Gift Store! 🛍️

For any queries, feel free to contact us.`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Send welcome message
  async sendWelcomeMessage(phoneNumber, userName) {
    const message = `🎉 *Welcome to Currency Gift Store!*

Hello ${userName}! 

Thank you for creating an account with us. We're excited to have you as part of our community! 

🎁 Explore our unique collection of currency gifts
💝 Perfect for special occasions
🚚 Fast and secure delivery

Start shopping now and discover amazing currency gifts!

Visit our website to browse our collection. 🛍️`;

    return await this.sendMessage(phoneNumber, message);
  }

  // Send order status update
  async sendOrderStatusUpdate(phoneNumber, orderDetails, status) {
    let message = `📦 *Order Update*

Hello ${orderDetails.customerName}!

Your order #${orderDetails.orderId} status has been updated:

`;

    switch (status.toLowerCase()) {
      case 'processing':
        message += '⏳ *Status: Processing*\nYour order is being prepared for shipment.';
        break;
      case 'shipped':
        message += `🚚 *Status: Shipped*\nYour order has been shipped!\n\nTracking ID: ${orderDetails.trackingId || 'Will be updated soon'}`;
        break;
      case 'delivered':
        message += '✅ *Status: Delivered*\nYour order has been delivered successfully! Hope you love your purchase! 🎉';
        break;
      case 'cancelled':
        message += '❌ *Status: Cancelled*\nYour order has been cancelled. Refund will be processed within 5-7 business days.';
        break;
      default:
        message += `📋 *Status: ${status}*`;
    }

    message += '\n\nFor any queries, feel free to contact us.\n\nThank you for shopping with Currency Gift Store! 🛍️';

    return await this.sendMessage(phoneNumber, message);
  }

  // Check if client is ready
  isClientReady() {
    return this.isReady;
  }

  // Get current QR code for admin panel
  getCurrentQRCode() {
    return this.currentQRCode;
  }

  // Get admin phone number
  getAdminPhone() {
    return this.adminPhone;
  }

  // Wait for QR code generation
  async waitForQRCode(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (this.currentQRCode) {
        resolve(this.currentQRCode);
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error('QR code generation timeout'));
      }, timeout);

      this.qrCallbacks.push((qrCode) => {
        clearTimeout(timeoutId);
        resolve(qrCode);
      });
    });
  }

  // Destroy the client
  async destroy() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      this.currentQRCode = null;
      this.qrCallbacks = [];
      console.log('🔌 WhatsApp client destroyed');
    }
  }
}

// Create a singleton instance
const whatsAppService = new WhatsAppService();

module.exports = whatsAppService;
