const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Coupon = require('../models/coupon.model');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const { sendCouponEmail } = require('../utils/emailService');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    
    // Create user
    const user = new User({
      name,
      email,
      password,
      role
    });
    
    await user.save();
    
    // Create welcome coupon
    const coupon = await Coupon.createSignupCoupon(user._id);
    
    // Add coupon to user's coupons
    user.coupons.push({
      coupon: coupon._id,
      obtainedAt: new Date(),
      isUsed: false
    });
    await user.save();
    
    // Send welcome email with coupon
    try {
      await sendCouponEmail(user.email, coupon.code, coupon.discountValue);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    // Track signup
    await trackUserActivity(req, 'signup', { userId: user._id });
    
    // Generate token
    const token = user.generateToken();
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toPublicProfile(),
        token
      }
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Check role if specified
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: 'Invalid role' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();
    
    // Track login
    await trackUserActivity(req, 'login', { userId: user._id, role: user.role });
    
    // Generate token
    const token = user.generateToken();
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toPublicProfile(),
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user.toPublicProfile()
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Logout
router.post('/logout', authenticate, async (req, res) => {
  try {
    await trackUserActivity(req, 'logout', { userId: req.user._id });
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates._id;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user._id);
    
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    res.json({
      success: true,
      data: user.addresses || []
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add new address
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const { type, street, city, state, zipCode, country, isDefault } = req.body;
    
    const user = await User.findById(req.user._id);
    
    // If this is set as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }
    
    user.addresses.push({
      type: type || 'home',
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault: isDefault || false
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Address added successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update address
router.put('/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = req.body;
    
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    // If setting as default, unset others
    if (updates.isDefault) {
      user.addresses.forEach(addr => {
        if (addr._id.toString() !== addressId) addr.isDefault = false;
      });
    }
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (key !== '_id') address[key] = updates[key];
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete address
router.delete('/addresses/:addressId', authenticate, async (req, res) => {
  try {
    const { addressId } = req.params;
    
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }
    
    user.addresses.pull(addressId);
    await user.save();
    
    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register as seller
router.post('/register-seller', authenticate, async (req, res) => {
  try {
    const { businessName, businessEmail, businessPhone, gstNumber, panNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    
    user.role = 'seller';
    user.sellerInfo = {
      businessName,
      businessEmail,
      businessPhone,
      gstNumber,
      panNumber,
      verificationStatus: 'pending',
      isVerified: false
    };
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Seller registration submitted for review',
      data: user.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Register seller error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Middleware to authenticate
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    User.findById(decoded.userId).select('-password').then(user => {
      if (!user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      
      req.user = user;
      next();
    });
    
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
}

module.exports = router;
