const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { adminProtect } = require('../middleware/adminAuthMiddleware');

// Send notification (email/whatsapp)
router.post('/send', notificationController.sendNotification);

// WhatsApp routes (admin only)
router.get('/whatsapp/status', adminProtect, notificationController.getWhatsAppStatus);
router.get('/whatsapp/qrcode', adminProtect, notificationController.getWhatsAppQRCode);
router.post('/whatsapp/initialize', adminProtect, notificationController.initializeWhatsApp);

// Test routes (admin only)
router.post('/test/email', adminProtect, notificationController.testEmail);
router.post('/test/whatsapp', adminProtect, notificationController.testWhatsApp);

module.exports = router;
