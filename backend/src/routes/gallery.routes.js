const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Protected routes (require login)
router.post('/save', authenticate, galleryController.saveToGallery);
router.get('/my', authenticate, galleryController.getMyGallery);
router.delete('/:id', authenticate, galleryController.deleteFromGallery);
router.patch('/:id/toggle-public', authenticate, galleryController.togglePublic);

// Public route (no auth needed)
router.get('/product/:productId', galleryController.getProductGallery);

module.exports = router;
