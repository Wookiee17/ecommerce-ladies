const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, reviewValidation } = require('../middleware/validation.middleware');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Protected routes - require authentication
router.post('/', authenticate, validate(reviewValidation), reviewController.createReview);
router.get('/my-reviews', authenticate, reviewController.getUserReviews);
router.put('/:reviewId', authenticate, reviewController.updateReview);
router.delete('/:reviewId', authenticate, reviewController.deleteReview);
router.post('/:reviewId/helpful', authenticate, reviewController.markHelpful);
router.post('/:reviewId/report', authenticate, reviewController.reportReview);
router.post('/share-link', authenticate, reviewController.shareReviewLink);

// Admin routes
router.get('/admin/reported', authenticate, authorize('admin'), reviewController.getReportedReviews);
router.post('/admin/:reviewId/moderate', authenticate, authorize('admin'), reviewController.moderateReview);

module.exports = router;
