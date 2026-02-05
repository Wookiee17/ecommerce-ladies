const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon.model');
const User = require('../models/user.model');
const auth = require('../middleware/auth.middleware').authenticate;
const { sendCouponEmail } = require('../utils/emailService');

// Generate welcome coupon for new user
router.post('/welcome', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if user already has a welcome coupon
    const existingCoupon = await Coupon.findOne({ 
      createdBy: userId,
      description: { $regex: 'Welcome', $options: 'i' }
    });
    
    if (existingCoupon) {
      return res.status(400).json({ 
        success: false, 
        message: 'Welcome coupon already generated' 
      });
    }
    
    // Create welcome coupon
    const coupon = await Coupon.createSignupCoupon(userId);
    
    // Add coupon to user's coupons
    user.coupons.push({
      coupon: coupon._id,
      obtainedAt: new Date(),
      isUsed: false
    });
    
    await user.save();
    
    // Send email with coupon
    await sendCouponEmail(user.email, coupon.code, coupon.discountValue);
    
    res.status(201).json({
      success: true,
      message: 'Welcome coupon generated successfully',
      data: {
        coupon: {
          code: coupon.code,
          discountValue: coupon.discountValue,
          validUntil: coupon.validUntil,
          description: coupon.description
        }
      }
    });
    
  } catch (error) {
    console.error('Welcome coupon error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validate coupon
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, cartTotal = 0 } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code is required' 
      });
    }
    
    const validation = await Coupon.validateCoupon(code, userId, cartTotal);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    res.json({
      success: true,
      message: 'Coupon is valid',
      data: {
        coupon: {
          code: validation.coupon.code,
          discountType: validation.coupon.discountType,
          discountValue: validation.coupon.discountValue,
          maxDiscountAmount: validation.coupon.maxDiscountAmount,
          description: validation.coupon.description
        }
      }
    });
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user coupons
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'coupons.coupon',
      match: { isActive: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const activeCoupons = user.coupons
      .filter(userCoupon => userCoupon.coupon && !userCoupon.isUsed)
      .map(userCoupon => ({
        _id: userCoupon.coupon._id,
        code: userCoupon.coupon.code,
        description: userCoupon.coupon.description,
        discountType: userCoupon.coupon.discountType,
        discountValue: userCoupon.coupon.discountValue,
        maxDiscountAmount: userCoupon.coupon.maxDiscountAmount,
        minOrderAmount: userCoupon.coupon.minOrderAmount,
        validUntil: userCoupon.coupon.validUntil,
        obtainedAt: userCoupon.obtainedAt,
        isUsed: userCoupon.isUsed
      }));
    
    res.json({
      success: true,
      data: activeCoupons
    });
    
  } catch (error) {
    console.error('Get user coupons error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Apply coupon (mark as used)
router.post('/apply', auth, async (req, res) => {
  try {
    const { code, orderId } = req.body;
    const userId = req.user.id;
    
    if (!code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon code is required' 
      });
    }
    
    const coupon = await Coupon.findOne({ code });
    
    if (!coupon) {
      return res.status(404).json({ 
        success: false, 
        message: 'Coupon not found' 
      });
    }
    
    if (!coupon.canBeUsedBy(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Coupon cannot be used by this user' 
      });
    }
    
    // Mark coupon as used
    await coupon.markAsUsed(userId);
    
    // Update user's coupon status
    const user = await User.findById(userId);
    const userCoupon = user.coupons.find(
      uc => uc.coupon.toString() === coupon._id.toString()
    );
    
    if (userCoupon) {
      userCoupon.isUsed = true;
      userCoupon.usedAt = new Date();
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        coupon: {
          code: coupon.code,
          discountValue: coupon.discountValue,
          discountType: coupon.discountType
        }
      }
    });
    
  } catch (error) {
    console.error('Apply coupon error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Track modal view
router.post('/track-modal', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    user.hasSeenSignupModal = true;
    await user.save();
    
    res.json({
      success: true,
      message: 'Modal view tracked successfully'
    });
    
  } catch (error) {
    console.error('Track modal error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
