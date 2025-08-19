const crypto = require('crypto');
require('dotenv').config();

// UPI Merchant Configuration
const upiConfig = {
  merchantId: process.env.UPI_MERCHANT_ID || 'DUMMY_MERCHANT_ID',
  merchantVpa: process.env.UPI_MERCHANT_VPA || 'merchant@bank',
  merchantName: 'Currency Gift Store',
  currency: 'INR'
};

// Generate checksum for UPI payment verification
const generateChecksum = (data, secretKey) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(JSON.stringify(data))
    .digest('hex');
};

// Verify UPI payment callback checksum
const verifyChecksum = (data, checksum, secretKey) => {
  const calculatedChecksum = generateChecksum(data, secretKey);
  return calculatedChecksum === checksum;
};

// Generate UPI payment URL for QR code
const generateUpiPaymentUrl = (referenceId, amount, description) => {
  return `upi://pay?pa=${upiConfig.merchantVpa}&pn=${encodeURIComponent(upiConfig.merchantName)}&am=${amount}&tr=${referenceId}&tn=${encodeURIComponent(description)}&cu=${upiConfig.currency}`;
};

module.exports = {
  upiConfig,
  generateChecksum,
  verifyChecksum,
  generateUpiPaymentUrl
};