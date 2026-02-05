const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: String,
  price: Number,
  quantity: Number,
  size: String,
  color: String,
  image: String,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    name: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  payment: {
    method: {
      type: String,
      enum: ['razorpay', 'card', 'upi', 'cod', 'wallet'],
      required: true
    },
    amount: Number,
    subtotal: Number,
    discount: Number,
    shippingCost: Number,
    tax: Number,
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending'
  },
  coupon: String,
  notes: String,
  tracking: {
    carrier: String,
    trackingNumber: String,
    url: String,
    updates: [{
      status: String,
      location: String,
      timestamp: Date
    }]
  },
  deliveredAt: Date,
  refundRequest: {
    requested: { type: Boolean, default: false },
    reason: String,
    items: [mongoose.Schema.Types.ObjectId],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    requestedAt: Date,
    resolvedAt: Date
  }
}, {
  timestamps: true
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
