const express = require('express');
const { register, login, listAdmins, adminListOrders, adminGetOrder, adminSummary } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', adminProtect, listAdmins);
router.get('/orders', adminProtect, adminListOrders);
router.get('/orders/:orderNumber', adminProtect, adminGetOrder);
router.get('/summary', adminProtect, adminSummary);

module.exports = router;
