const crypto = require('crypto');
const Order = require('../models/order.model');
const User = require('../models/user.model');
const {
  PAYMENT_METHODS,
  getRazorpayInstance,
  getStripeInstance
} = require('../config/payment.config');

/**
 * Create a payment order with the configured provider.
 *
 * Razorpay is the primary gateway for domestic payments
 * (cards, UPI, wallets, EMI). Stripe support is scaffolded
 * for international payments via PaymentIntents.
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = 'INR',
      paymentMethod = PAYMENT_METHODS.RAZORPAY,
      orderId // Optional: existing DB Order id to bind to
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required and must be greater than 0'
      });
    }

    // Fetch the user for prefill data
    const user = await User.findById(req.user._id);

    // Optional: try to load the existing Order to attach gateway IDs
    let existingOrder = null;
    if (orderId) {
      existingOrder = await Order.findById(orderId);
    }

    // Handle COD separately – no external gateway call needed here.
    if (paymentMethod === PAYMENT_METHODS.COD) {
      return res.status(200).json({
        success: true,
        data: {
          provider: 'cod',
          amount,
          currency,
          message: 'Cash on Delivery selected. No online payment required.'
        }
      });
    }

    // Razorpay flow – used for cards, UPI, wallets, EMI (domestic)
    if (
      paymentMethod === PAYMENT_METHODS.RAZORPAY ||
      paymentMethod === PAYMENT_METHODS.UPI ||
      paymentMethod === PAYMENT_METHODS.WALLET ||
      paymentMethod === PAYMENT_METHODS.CARD
    ) {
      const razorpay = getRazorpayInstance();

      if (!razorpay) {
        return res.status(500).json({
          success: false,
          message: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
        });
      }

      const options = {
        amount: Math.round(amount * 100), // smallest currency unit
        currency,
        receipt: orderId || `order_rcpt_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          orderId: orderId || ''
        }
      };

      const rpOrder = await razorpay.orders.create(options);

      if (existingOrder) {
        existingOrder.payment = existingOrder.payment || {};
        existingOrder.payment.razorpayOrderId = rpOrder.id;
        existingOrder.payment.amount = amount;
        existingOrder.payment.currency = currency;
        existingOrder.payment.method = paymentMethod;
        existingOrder.payment.status = 'pending';
        await existingOrder.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          provider: 'razorpay',
          keyId: process.env.RAZORPAY_KEY_ID,
          amount,
          currency,
          razorpayOrderId: rpOrder.id,
          prefill: {
            name: user?.name,
            email: user?.email,
            contact: user?.phone
          }
        }
      });
    }

    // Stripe flow – scaffold for international card payments.
    if (paymentMethod === PAYMENT_METHODS.STRIPE) {
      const stripe = getStripeInstance();

      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.'
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        metadata: {
          userId: req.user._id.toString(),
          orderId: orderId || ''
        }
      });

      if (existingOrder) {
        existingOrder.payment = existingOrder.payment || {};
        existingOrder.payment.amount = amount;
        existingOrder.payment.currency = currency;
        existingOrder.payment.method = PAYMENT_METHODS.STRIPE;
        existingOrder.payment.status = 'pending';
        existingOrder.payment.stripePaymentIntentId = paymentIntent.id;
        await existingOrder.save();
      }

      return res.status(200).json({
        success: true,
        data: {
          provider: 'stripe',
          clientSecret: paymentIntent.client_secret,
          amount,
          currency
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: `Unsupported payment method: ${paymentMethod}`
    });
  } catch (error) {
    console.error('Create payment order error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

/**
 * Verify a Razorpay payment using signature validation.
 * On success, mark the associated Order as paid/confirmed.
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing Razorpay verification parameters'
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay secret is not configured'
      });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay signature'
      });
    }

    let updatedOrder = null;
    if (orderId) {
      updatedOrder = await Order.findById(orderId);
      if (updatedOrder) {
        updatedOrder.payment = updatedOrder.payment || {};
        updatedOrder.payment.razorpayOrderId = razorpay_order_id;
        updatedOrder.payment.razorpayPaymentId = razorpay_payment_id;
        updatedOrder.payment.status = 'completed';
        updatedOrder.payment.paidAt = new Date();

        // Move order status to confirmed if it was pending
        if (updatedOrder.status === 'pending') {
          updatedOrder.status = 'confirmed';
        }

        await updatedOrder.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order: updatedOrder
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify payment'
    });
  }
};

/**
 * Fetch basic payment details from the Order model.
 */
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const order = await Order.findOne({
      'payment.razorpayPaymentId': paymentId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.status(200).json({
      success: true,
      payment: {
        id: paymentId,
        status: order.payment?.status,
        amount: order.payment?.amount,
        currency: order.payment?.currency || 'INR',
        orderId: order._id
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment details'
    });
  }
};

/**
 * Process a refund via the configured provider and update the Order.
 */
exports.processRefund = async (req, res) => {
  try {
    const {
      orderId,
      amount // optional; if omitted, full amount will be refunded where supported
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required to process a refund'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const refundAmount =
      typeof amount === 'number' && amount > 0
        ? amount
        : order.payment?.amount;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount is invalid'
      });
    }

    let provider = null;
    if (order.payment?.razorpayPaymentId) {
      const razorpay = getRazorpayInstance();
      if (!razorpay) {
        return res.status(500).json({
          success: false,
          message: 'Razorpay is not configured'
        });
      }

      await razorpay.payments.refund(order.payment.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100)
      });

      provider = 'razorpay';
    } else if (order.payment?.method === PAYMENT_METHODS.STRIPE) {
      const stripe = getStripeInstance();
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: 'Stripe is not configured'
        });
      }

      if (!order.payment.stripePaymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Stripe payment information is missing on the order'
        });
      }

      await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100)
      });

      provider = 'stripe';
    } else {
      return res.status(400).json({
        success: false,
        message: 'No refundable payment provider found for this order'
      });
    }

    order.payment.status = 'refunded';
    if (order.refundRequest) {
      order.refundRequest.status = 'completed';
      order.refundRequest.resolvedAt = new Date();
    }
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        provider,
        orderId: order._id,
        amount: refundAmount
      }
    });
  } catch (error) {
    console.error('Process refund error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to process refund'
    });
  }
};

/**
 * List basic payment history for the current user using Orders.
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const payments = orders.map(order => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.payment?.status,
      amount: order.payment?.amount,
      currency: order.payment?.currency || 'INR',
      method: order.payment?.method,
      paidAt: order.payment?.paidAt
    }));

    return res.status(200).json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch payment history'
    });
  }
};

/**
 * Webhook handler scaffold for Razorpay / Stripe.
 * This should be configured with a separate endpoint secret in production.
 */
exports.handleWebhook = async (req, res) => {
  try {
    // NOTE: In production you must validate the webhook signature
    // from the provider (e.g. x-razorpay-signature, Stripe-Signature).
    const event = req.body;

    console.log('Received payment webhook event:', event?.event || event?.type);

    // Minimal scaffold for future expansion; for now we just acknowledge.
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Payment webhook error:', error);
    return res.status(500).json({ status: 'error' });
  }
};

