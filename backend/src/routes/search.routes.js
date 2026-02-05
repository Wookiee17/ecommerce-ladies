const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Product = require('../models/product.model');
const { SearchHistory } = require('../models/analytics.model');
const { trackSearch } = require('../middleware/analytics.middleware');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/search/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'search-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Text search
router.get('/text', async (req, res) => {
  try {
    const { q, category = '', page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const query = { isActive: true };
    
    // Text search using MongoDB text index
    query.$text = { $search: q };
    
    if (category) query.category = category;
    
    const products = await Product.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    // Track search
    await trackSearch(req, q, total);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Text search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Advanced search with filters
router.get('/advanced', async (req, res) => {
  try {
    const {
      q = '',
      category = '',
      subcategory = '',
      minPrice = 0,
      maxPrice = 1000000,
      colors = '',
      sizes = '',
      rating = 0,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = req.query;
    
    const query = { isActive: true };
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Filters
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseInt(minPrice);
      if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }
    if (rating) query.rating = { $gte: parseFloat(rating) };
    
    // Color filter
    if (colors) {
      const colorArray = colors.split(',');
      query['variants.colors.name'] = { $in: colorArray };
    }
    
    // Size filter
    if (sizes) {
      const sizeArray = sizes.split(',');
      query['variants.sizes.name'] = { $in: sizeArray };
    }
    
    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { rating: -1 };
        break;
      case 'newest':
        sort = { createdAt: -1 };
        break;
      case 'bestselling':
        sort = { 'stats.sales': -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }
    
    const products = await Product.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    // Track search
    if (q) await trackSearch(req, q, total);
    
    res.json({
      success: true,
      data: products,
      filters: {
        category,
        subcategory,
        minPrice,
        maxPrice,
        colors: colors ? colors.split(',') : [],
        sizes: sizes ? sizes.split(',') : [],
        rating
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Image search
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    
    const imagePath = req.file.path;
    
    // For now, return products from the same category based on image analysis
    // In production, you would use TensorFlow.js or a vision API to analyze the image
    
    // Get recent products as "similar" results
    // In production, this would use vector similarity search
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20);
    
    // Track image search
    await trackSearch(req, '[image search]', products.length);
    
    res.json({
      success: true,
      message: 'Image search completed',
      data: products,
      note: 'In production, this would use AI image analysis for similarity matching'
    });
    
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get search suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || q.trim().length === 0) {
      // Return trending searches
      const trending = await SearchHistory.aggregate([
        {
          $group: {
            _id: '$query',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) },
        { $project: { query: '$_id', count: 1, _id: 0 } }
      ]);
      
      return res.json({
        success: true,
        data: trending.map(t => t.query)
      });
    }
    
    // Search for matching queries
    const suggestions = await SearchHistory.aggregate([
      {
        $match: {
          query: { $regex: q, $options: 'i' }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { query: '$_id', _id: 0 } }
    ]);
    
    // Also search product names
    const productSuggestions = await Product.find({
      isActive: true,
      name: { $regex: q, $options: 'i' }
    })
      .limit(parseInt(limit))
      .select('name');
    
    const allSuggestions = [
      ...suggestions.map(s => s.query),
      ...productSuggestions.map(p => p.name)
    ];
    
    // Remove duplicates and limit
    const uniqueSuggestions = [...new Set(allSuggestions)].slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: uniqueSuggestions
    });
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const popular = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: { query: '$_id', count: 1, _id: 0 } }
    ]);
    
    res.json({
      success: true,
      data: popular
    });
    
  } catch (error) {
    console.error('Popular searches error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
