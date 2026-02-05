const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Get cart
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.items.product');
    
    res.json({
      success: true,
      data: user.cart
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add to cart
router.post('/add', authenticate, async (req, res) => {
  try {
    const { productId, quantity = 1, selectedColor, selectedSize } = req.body;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: 'Insufficient stock' });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if item already in cart
    const existingItemIndex = user.cart.items.findIndex(
      item => item.product.toString() === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
    );
    
    if (existingItemIndex > -1) {
      // Update quantity
      user.cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      user.cart.items.push({
        product: productId,
        quantity,
        selectedColor,
        selectedSize
      });
    }
    
    // Recalculate total
    await user.populate('cart.items.product');
    user.cart.total = user.cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    await user.save();
    
    // Track activity
    await trackUserActivity(req, 'cart_add', { 
      productId, 
      quantity,
      selectedColor,
      selectedSize
    });
    
    res.json({
      success: true,
      message: 'Item added to cart',
      data: user.cart
    });
    
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update cart item
router.put('/update', authenticate, async (req, res) => {
  try {
    const { productId, quantity, selectedColor, selectedSize } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const itemIndex = user.cart.items.findIndex(
      item => item.product.toString() === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      // Remove item
      user.cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity
      user.cart.items[itemIndex].quantity = quantity;
    }
    
    // Recalculate total
    await user.populate('cart.items.product');
    user.cart.total = user.cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Cart updated',
      data: user.cart
    });
    
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove from cart
router.delete('/remove', authenticate, async (req, res) => {
  try {
    const { productId, selectedColor, selectedSize } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const itemIndex = user.cart.items.findIndex(
      item => item.product.toString() === productId &&
              item.selectedColor === selectedColor &&
              item.selectedSize === selectedSize
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    user.cart.items.splice(itemIndex, 1);
    
    // Recalculate total
    await user.populate('cart.items.product');
    user.cart.total = user.cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    await user.save();
    
    // Track activity
    await trackUserActivity(req, 'cart_remove', { productId });
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      data: user.cart
    });
    
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear cart
router.delete('/clear', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.cart.items = [];
    user.cart.total = 0;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Cart cleared',
      data: user.cart
    });
    
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
