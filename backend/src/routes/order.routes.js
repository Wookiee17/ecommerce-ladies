const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Order = require('../models/order.model');
const { generateInvoiceHtml } = require('../utils/invoice.service');

// Helper to validate allowed status transitions
const isValidStatusTransition = (currentStatus, nextStatus) => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered', 'returned'],
    delivered: ['returned'],
    cancelled: [],
    returned: []
  };

  return transitions[currentStatus]?.includes(nextStatus);
};

// Create order from the authenticated user's cart
router.post('/create', authenticate, async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;

    const user = await User.findById(req.user._id).populate('cart.items.product');

    if (!user || user.cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // Get address
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(400).json({ success: false, message: 'Address not found' });
    }

    // Calculate totals
    const subtotal = user.cart.total;
    const shipping = subtotal >= 999 ? 0 : 99;
    const discount = 0; // Coupons/discounts can be wired here later
    const tax = 0;
    const total = subtotal + shipping - discount + tax;

    // Build order items from cart
    const items = user.cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      image: item.product.images?.[0]?.url || null,
      seller: item.product.seller
    }));

    const orderNumber = `ORD-${Date.now()}`;

    const order = await Order.create({
      user: user._id,
      orderNumber,
      items,
      shippingAddress: {
        name: address.name || user.name,
        phone: user.phone,
        address: address.street,
        city: address.city,
        state: address.state,
        pincode: address.zipCode,
        landmark: ''
      },
      payment: {
        method: paymentMethod || 'cod',
        amount: total,
        subtotal,
        discount,
        shippingCost: shipping,
        tax,
        currency: user.preferences?.currency || 'INR',
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      status: 'pending'
    });

    // Update product stats & inventory
    for (const item of user.cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: {
          'stats.sales': item.quantity,
          'stats.revenue': item.product.price * item.quantity,
          stock: -item.quantity
        }
      });

      // Update seller earnings
      const product = await Product.findById(item.product._id);
      if (product?.seller) {
        const seller = await User.findById(product.seller);
        if (seller && seller.role === 'seller') {
          const earnings = item.product.price * item.quantity;
          const commission = earnings * (seller.sellerInfo.commissionRate / 100);
          seller.sellerInfo.totalSales += item.quantity;
          seller.sellerInfo.totalEarnings += (earnings - commission);
          await seller.save();
        }
      }
    }

    // Clear cart
    user.cart.items = [];
    user.cart.total = 0;
    await user.save();

    // Track purchase
    await trackUserActivity(req, 'purchase', {
      orderId: order.orderNumber,
      total: order.payment.amount
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        amount: order.payment.amount,
        items: order.items
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's orders
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 20;

    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Order.countDocuments({ user: req.user._id })
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by ID or orderNumber for the current user
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const query = {
      user: req.user._id,
      $or: [{ orderNumber: orderId }]
    };

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query.$or.push({ _id: orderId });
    }

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get invoice for an order (HTML)
router.get('/:orderId/invoice', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only order owner or admin can view invoice
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this invoice'
      });
    }

    const html = generateInvoiceHtml(order);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// User: request a return for specific items
router.post('/:orderId/return-request', authenticate, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason, items = [] } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only request returns for your own orders'
      });
    }

    const validItemIds = new Set(order.items.map((item) => item._id.toString()));
    const requestedItemIds = items.filter((id) => validItemIds.has(id));

    if (!requestedItemIds.length) {
      return res.status(400).json({
        success: false,
        message: 'No valid items selected for return'
      });
    }

    order.refundRequest = {
      requested: true,
      reason: reason || '',
      items: requestedItemIds,
      status: 'pending',
      requestedAt: new Date()
    };

    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully',
      data: order.refundRequest
    });
  } catch (error) {
    console.error('Create return request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin/Seller: update refund request status
router.patch('/:orderId/refund-request', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'approved' | 'rejected' | 'completed'

    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund request status'
      });
    }

    const order = await Order.findById(orderId);
    if (!order || !order.refundRequest?.requested) {
      return res.status(404).json({
        success: false,
        message: 'Refund request not found for this order'
      });
    }

    order.refundRequest.status = status;
    if (status === 'completed') {
      order.refundRequest.resolvedAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Refund request updated successfully',
      data: order.refundRequest
    });
  } catch (error) {
    console.error('Update refund request error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: get all orders
router.get('/admin/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 50;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit)
        .populate('user', 'name email'),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Admin get all orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seller: get orders containing seller's products
router.get('/seller/my', authenticate, authorize('seller'), async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 50;

    const filter = {
      'items.seller': req.user._id
    };

    if (status) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Order.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Seller get my orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin/Seller: update order status with lifecycle validation
router.patch('/:orderId/status', authenticate, authorize('admin', 'seller'), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'New status is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (!isValidStatusTransition(order.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`
      });
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
