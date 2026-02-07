const mongoose = require('mongoose');

const userTryOnSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // User's stored photo for try-ons
  userPhoto: {
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  // Generated try-on images for products
  generatedImages: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Image' },
    url: String,
    generatedAt: { type: Date, default: Date.now }
  }],
  // Rate limiting tracking
  generationCount: { type: Number, default: 0 },
  generationWindowStart: { type: Date, default: Date.now },
  lastGenerationAt: { type: Date }
}, {
  timestamps: true
});

// Static method to check rate limit
userTryOnSchema.statics.checkRateLimit = async function(userId) {
  const userTryOn = await this.findOne({ userId });
  
  if (!userTryOn) {
    return { allowed: true, remaining: 10, resetAt: new Date(Date.now() + 10 * 60 * 1000) };
  }
  
  const now = new Date();
  const windowStart = userTryOn.generationWindowStart;
  const tenMinutes = 10 * 60 * 1000;
  
  // Check if window has expired (10 minutes)
  if (now - windowStart > tenMinutes) {
    // Reset window
    userTryOn.generationCount = 0;
    userTryOn.generationWindowStart = now;
    await userTryOn.save();
    return { allowed: true, remaining: 10, resetAt: new Date(now.getTime() + tenMinutes) };
  }
  
  // Check if under limit
  const remaining = Math.max(0, 10 - userTryOn.generationCount);
  const allowed = remaining > 0;
  const resetAt = new Date(windowStart.getTime() + tenMinutes);
  
  return { allowed, remaining, resetAt };
};

// Static method to increment generation count
userTryOnSchema.statics.incrementGeneration = async function(userId) {
  const userTryOn = await this.findOneAndUpdate(
    { userId },
    { 
      $inc: { generationCount: 1 },
      $set: { lastGenerationAt: new Date() }
    },
    { upsert: true, new: true }
  );
  return userTryOn;
};

module.exports = mongoose.model('UserTryOn', userTryOnSchema);
