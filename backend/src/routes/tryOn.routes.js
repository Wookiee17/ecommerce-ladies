const express = require('express');
const router = express.Router();
const tryOnController = require('../controllers/tryOn.controller');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Get user's try-on data (photo + generated images + rate limit)
router.get('/user-data', authenticate, tryOnController.getUserTryOnData);

// Upload user's photo for try-ons
router.post(
  '/upload-photo',
  authenticate,
  upload.fields([{ name: 'userImage', maxCount: 1 }]),
  tryOnController.uploadUserPhoto
);

// Delete user's photo
router.delete('/photo', authenticate, tryOnController.deleteUserPhoto);

// Check rate limit
router.get('/rate-limit', authenticate, tryOnController.checkRateLimit);

// Generate try-on for a single product
router.post('/generate', authenticate, tryOnController.generateTryOn);

// Generate try-ons for first 10 products
router.post('/generate-first-ten', authenticate, tryOnController.generateForFirstTenProducts);

module.exports = router;
