const express = require('express');
const { 
  getProducts, 
  getProductById, 
  getProductsByType,
  createProduct,
  updateProduct
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { productValidator } = require('../utils/validators');
const { validateRequest } = require('../middleware/validationMiddleware');
const { upload } = require('../utils/fileUpload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', getProducts);

// @route   GET /api/products/type/:type
// @desc    Get products by type
// @access  Public
router.get('/type/:type', getProductsByType);

// @route   GET /api/products/:id
// @desc    Get product by id
// @access  Public
router.get('/:id', getProductById);

// @route   POST /api/products
// @desc    Create a new product
// @access  Private/Admin
router.post(
  '/',
  protect, // Would typically add admin check middleware here
  upload.single('product_image'),
  productValidator,
  validateRequest,
  createProduct
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Private/Admin
router.put(
  '/:id',
  protect, // Would typically add admin check middleware here
  upload.single('product_image'),
  updateProduct
);

module.exports = router;