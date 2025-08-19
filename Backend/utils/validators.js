const { check } = require('express-validator');

// User registration validator
exports.registerValidator = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  check('phone')
    .optional()
    .matches(/^[0-9+\s-]{10,15}$/)
    .withMessage('Please provide a valid phone number')
];

// Login validator
exports.loginValidator = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Product creation validator
exports.productValidator = [
  check('name')
    .notEmpty()
    .withMessage('Product name is required'),
  
  check('type')
    .notEmpty()
    .withMessage('Product type is required')
    .isIn(['currency_note', 'photo_frame', 'resin_frame', 'zodiac_coin', 'zodiac'])
    .withMessage('Invalid product type'),
  
  check('price')
    .notEmpty()
    .withMessage('Price is required')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  check('stock_quantity')
    .optional()
    .isNumeric()
    .withMessage('Stock quantity must be a number')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a positive integer')
];

// Order creation validator (cart-based multi-item)
exports.orderValidator = [
  check('customer_name')
    .notEmpty()
    .withMessage('Customer name is required'),
  
  // customer_email is optional because authenticated requests will use req.user.email
  check('customer_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email'),
  
  check('customer_phone')
    .notEmpty()
    .withMessage('Customer phone is required')
    .matches(/^[0-9+\s-]{10,15}$/)
    .withMessage('Please provide a valid phone number'),
  
  check('shipping_address')
    .notEmpty()
    .withMessage('Shipping address is required'),

  // cart_items array validation
  check('cart_items')
    .isArray({ min: 1 })
    .withMessage('cart_items must be a non-empty array'),

  // per-item validation (prices are resolved server-side)
  check('cart_items.*.product_name')
    .notEmpty()
    .withMessage('Each cart item must have product_name'),
  check('cart_items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each cart item must have a valid quantity')
];

// UPI payment verification validator
exports.upiPaymentValidator = [
  check('orderNumber')
    .notEmpty()
    .withMessage('Order number is required'),
  
  check('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required'),
  
  check('status')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['SUCCESS', 'FAILURE', 'PENDING'])
    .withMessage('Invalid payment status')
];