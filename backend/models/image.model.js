const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: Buffer,
    required: true
  },
  category: {
    type: String,
    enum: ['dress', 'jewelry', 'beauty', 'product', 'avatar'],
    default: 'product'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
imageSchema.index({ category: 1, productId: 1 });
imageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Image', imageSchema);
