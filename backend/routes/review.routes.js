const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const {
  createReview,
  getPropertyReviews,
  getUserReviews,
  deleteReview,
} = require('../controllers/review.controller');

// Protected — user's own reviews (must be above /:propertyId)
router.get('/user/my-reviews', protect, authorizeRoles('user'), getUserReviews);

// Public — get reviews for a property
router.get('/:propertyId', getPropertyReviews);

// Protected — user creates/updates a review
router.post('/', protect, authorizeRoles('user'), createReview);

// Protected — user deletes own review
router.delete('/:reviewId', protect, authorizeRoles('user'), deleteReview);

module.exports = router;
