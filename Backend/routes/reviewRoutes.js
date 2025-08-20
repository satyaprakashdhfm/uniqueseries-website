const express = require('express');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview
} = require('../controllers/productReviewController');

const router = express.Router();

// Public: list reviews for a product
router.get('/product/:productName', getProductReviews);

// Logged-in user reviews
router.get('/user', protect, getUserReviews);

// Create review
router.post('/', protect, createReview);

router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
