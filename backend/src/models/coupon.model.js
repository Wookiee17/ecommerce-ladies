const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscountAmount: {
    type: Number,
    default: null
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  usageLimit: {
    type: Number,
    default: null
  },
  usageCount: {
    type: Number,
    default: 0
  },
  userUsageLimit: {
    type: Number,
    default: 1
  },
  userUsage: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usageCount: {
      type: Number,
      default: 0
    },
    usedAt: Date
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  autoApply: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
couponSchema.index({ code: 1 });
couponSchema.index({ validUntil: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ 'userUsage.user': 1 });

// Instance methods
couponSchema.methods.isValid = function() {
  const now = new Date();
  return this.isActive && 
         this.validFrom <= now && 
         this.validUntil >= now &&
         (this.usageLimit === null || this.usageCount < this.usageLimit);
};

couponSchema.methods.canBeUsedBy = function(userId) {
  if (!this.isValid()) return false;
  
  const userUsage = this.userUsage.find(u => u.user.toString() === userId.toString());
  if (userUsage && userUsage.usageCount >= this.userUsageLimit) {
    return false;
  }
  
  return true;
};

couponSchema.methods.markAsUsed = function(userId) {
  this.usageCount += 1;
  
  let userUsage = this.userUsage.find(u => u.user.toString() === userId.toString());
  if (!userUsage) {
    userUsage = {
      user: userId,
      usageCount: 0,
      usedAt: new Date()
    };
    this.userUsage.push(userUsage);
  }
  
  userUsage.usageCount += 1;
  userUsage.usedAt = new Date();
  
  return this.save();
};

// Static methods
couponSchema.statics.generateUniqueCode = async function(prefix = 'COUPON') {
  const { v4: uuidv4 } = require('uuid');
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = `${prefix}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const existing = await this.findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
};

couponSchema.statics.createSignupCoupon = async function(userId) {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7); // 7 days from now
  
  const code = await this.generateUniqueCode('WELCOME');
  
  const coupon = new this({
    code,
    description: 'Welcome! Get 30% off on all categories',
    discountType: 'percentage',
    discountValue: 30,
    validUntil,
    userUsageLimit: 1,
    autoApply: true,
    createdBy: userId
  });
  
  return coupon.save();
};

couponSchema.statics.validateCoupon = async function(code, userId, cartTotal = 0) {
  const coupon = await this.findOne({ code, isActive: true });
  
  if (!coupon) {
    return { valid: false, message: 'Coupon not found or inactive' };
  }
  
  if (!coupon.isValid()) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  if (cartTotal < coupon.minOrderAmount) {
    return { 
      valid: false, 
      message: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
    };
  }
  
  if (!coupon.canBeUsedBy(userId)) {
    return { valid: false, message: 'Coupon usage limit exceeded' };
  }
  
  return { valid: true, coupon };
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
