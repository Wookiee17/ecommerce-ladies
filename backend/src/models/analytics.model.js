const mongoose = require('mongoose');

// User Activity Schema
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  activityType: {
    type: String,
    enum: ['page_view', 'product_view', 'search', 'cart_add', 'cart_remove', 'wishlist_add', 'wishlist_remove', 'purchase', 'login', 'logout', 'signup'],
    required: true,
    index: true
  },
  page: {
    type: String,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  searchQuery: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Location data
  location: {
    country: String,
    city: String,
    region: String,
    latitude: Number,
    longitude: Number,
    timezone: String
  },
  // Device info
  device: {
    type: String, // mobile, tablet, desktop
    os: String,
    browser: String,
    screenResolution: String
  },
  // IP and network
  ipAddress: String,
  userAgent: String,
  referrer: String,
  // Timing
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  }
}, {
  timestamps: true
});

// Page Visit Schema
const pageVisitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  page: {
    type: String,
    required: true,
    index: true
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: Date,
  timeSpent: Number, // in seconds
  location: {
    country: String,
    city: String,
    region: String
  },
  device: {
    type: String,
    os: String,
    browser: String
  },
  ipAddress: String
}, {
  timestamps: true
});

// Search History Schema
const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: String,
  query: {
    type: String,
    required: true,
    index: true
  },
  resultsCount: Number,
  clickedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  location: {
    country: String,
    city: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// User Session Schema
const userSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  totalTimeSpent: Number, // in seconds
  pagesVisited: [String],
  productsViewed: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  location: {
    country: String,
    city: String,
    region: String
  },
  device: {
    type: String,
    os: String,
    browser: String,
    screenResolution: String
  },
  ipAddress: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Analytics Summary Schema (for dashboard)
const analyticsSummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  totalVisits: Number,
  uniqueVisitors: Number,
  newUsers: Number,
  returningUsers: Number,
  totalOrders: Number,
  totalRevenue: Number,
  averageOrderValue: Number,
  topProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    views: Number,
    sales: Number
  }],
  topSearches: [{
    query: String,
    count: Number
  }],
  deviceBreakdown: {
    mobile: Number,
    tablet: Number,
    desktop: Number
  },
  locationBreakdown: [{
    country: String,
    visits: Number
  }]
}, {
  timestamps: true
});

// Indexes for performance
userActivitySchema.index({ timestamp: -1, activityType: 1 });
userActivitySchema.index({ userId: 1, timestamp: -1 });
pageVisitSchema.index({ userId: 1, entryTime: -1 });
searchHistorySchema.index({ query: 'text' });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
const PageVisit = mongoose.model('PageVisit', pageVisitSchema);
const SearchHistory = mongoose.model('SearchHistory', searchHistorySchema);
const UserSession = mongoose.model('UserSession', userSessionSchema);
const AnalyticsSummary = mongoose.model('AnalyticsSummary', analyticsSummarySchema);

module.exports = {
  UserActivity,
  PageVisit,
  SearchHistory,
  UserSession,
  AnalyticsSummary
};
