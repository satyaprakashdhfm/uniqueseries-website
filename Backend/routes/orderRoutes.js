const express = require('express');
const { 
  createOrder, 
  getOrderById, 
  getUserOrders,
  getUpiPaymentDetails,
  verifyUpiPayment
} = require('../controllers/orderController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { orderValidator, upiPaymentValidator } = require('../utils/validators');
const { validateRequest } = require('../middleware/validationMiddleware');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Public/Private (works with or without auth)
router.post(
  '/', 
  optionalAuth, 
  orderValidator, 
  validateRequest, 
  createOrder
);

// @route   GET /api/orders/user
// @desc    Get all orders for logged in user
// @access  Private
router.get('/user', protect, getUserOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Public/Private (can access without auth, but checks ownership if authenticated)
router.get('/:id', optionalAuth, getOrderById);

// @route   GET /api/orders/:orderNumber/payment
// @desc    Get UPI payment details for an order
// @access  Public
router.get('/:orderNumber/payment', getUpiPaymentDetails);

// @route   POST /api/orders/verify-payment
// @desc    Verify UPI payment status
// @access  Public
router.post(
  '/verify-payment', 
  upiPaymentValidator, 
  validateRequest, 
  verifyUpiPayment
);

module.exports = router;