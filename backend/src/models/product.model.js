const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Category
  category: {
    type: String,
    required: true,
    enum: ['dress', 'jewelry', 'beauty'],
    index: true
  },
  subcategory: {
    type: String,
    required: true,
    index: true
  },
  
  // Images
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Variants (for dresses)
  variants: {
    colors: [{
      name: String,
      hexCode: String,
      image: String
    }],
    sizes: [{
      name: String,
      measurements: String,
      inStock: { type: Boolean, default: true }
    }]
  },
  
  // Inventory
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // Product details
  details: {
    material: String,
    careInstructions: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    countryOfOrigin: { type: String, default: 'India' },
    warranty: String
  },
  
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String],
    slug: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  
  // Ratings & Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    images: [String],
    helpful: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Flags
  isActive: {
    type: Boolean,
    default: true
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestseller: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Seller info
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Sales stats
  stats: {
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  
  // Tags for search
  tags: [{
    type: String,
    index: true
  }],
  
  // For image search
  imageEmbedding: [Number], // Vector embedding for similarity search
  
  // Bulk upload tracking
  bulkUploadId: String,
  uploadStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Text search index
productSchema.index({ 
  name: 'text', 
  description: 'text',
  tags: 'text'
});

// Compound indexes for filtering
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ seller: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Method to get primary image
productSchema.methods.getPrimaryImage = function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : this.images[0]?.url || '/images/placeholder.jpg';
};

// Method to check stock availability
productSchema.methods.isInStock = function() {
  return this.stock > 0 && this.isActive;
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
