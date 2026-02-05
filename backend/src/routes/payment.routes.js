const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Create Razorpay order
router.post('/create-order', authenticate, paymentController.createOrder);

// Verify payment
router.post('/verify', authenticate, paymentController.verifyPayment);

// Get payment details
router.get('/:paymentId', authenticate, paymentController.getPaymentDetails);

// Process refund
router.post('/refund', authenticate, paymentController.processRefund);

// Get user's payment history
router.get('/history/my', authenticate, paymentController.getPaymentHistory);

// Webhook for Razorpay events (public - no auth required)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
