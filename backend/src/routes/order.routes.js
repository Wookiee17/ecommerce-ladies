const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Create order (placeholder - implement with Order model)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { addressId, paymentMethod } = req.body;
    
    const user = await User.findById(req.user._id).populate('cart.items.product');
    
    if (user.cart.items.length === 0) {
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
    const total = subtotal + shipping;
    
    // Create order (placeholder response)
    const order = {
      orderId: 'ORD-' + Date.now(),
      items: user.cart.items,
      subtotal,
      shipping,
      total,
      address,
      paymentMethod,
      status: 'pending',
      createdAt: new Date()
    };
    
    // Update product stats
    for (const item of user.cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { 
          'stats.sales': item.quantity,
          'stats.revenue': item.product.price * item.quantity,
          stock: -item.quantity
        }
      });
    }
    
    // Update seller earnings
    for (const item of user.cart.items) {
      const product = await Product.findById(item.product._id);
      const seller = await User.findById(product.seller);
      if (seller && seller.role === 'seller') {
        const earnings = item.product.price * item.quantity;
        const commission = earnings * (seller.sellerInfo.commissionRate / 100);
        seller.sellerInfo.totalSales += item.quantity;
        seller.sellerInfo.totalEarnings += (earnings - commission);
        await seller.save();
      }
    }
    
    // Clear cart
    user.cart.items = [];
    user.cart.total = 0;
    await user.save();
    
    // Track purchase
    await trackUserActivity(req, 'purchase', { 
      orderId: order.orderId,
      total: order.total 
    });
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
    
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user orders
router.get('/', authenticate, async (req, res) => {
  try {
    // Placeholder - implement with Order model
    res.json({
      success: true,
      data: [],
      message: 'Orders feature coming soon'
    });
    
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get order by ID
router.get('/:orderId', authenticate, async (req, res) => {
  try {
    // Placeholder - implement with Order model
    res.json({
      success: true,
      data: null,
      message: 'Orders feature coming soon'
    });
    
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
