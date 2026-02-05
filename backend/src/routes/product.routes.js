const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category = '', 
      subcategory = '',
      search = '',
      minPrice = 0,
      maxPrice = 1000000,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = { isActive: true };
    
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    query.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
    
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const products = await Product.find(query)
      .populate('seller', 'name sellerInfo.businessName')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort(sort);
    
    const total = await Product.countDocuments(query);
    
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
    console.error('Get products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single product (public)
router.get('/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .populate('seller', 'name sellerInfo.businessName');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Increment view count
    product.stats.views += 1;
    await product.save();
    
    // Track product view
    await trackUserActivity(req, 'product_view', { 
      productId: product._id,
      productName: product.name 
    });
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isFeatured: true })
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get new arrivals
router.get('/new-arrivals/list', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isNew: true })
      .limit(10)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Get new arrivals error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get bestsellers
router.get('/bestsellers/list', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isBestseller: true })
      .limit(10)
      .sort({ 'stats.sales': -1 });
    
    res.json({
      success: true,
      data: products
    });
    
  } catch (error) {
    console.error('Get bestsellers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Product.countDocuments({ category: cat, isActive: true });
        const subcategories = await Product.distinct('subcategory', { category: cat, isActive: true });
        return { name: cat, count, subcategories };
      })
    );
    
    res.json({
      success: true,
      data: categoriesWithCount
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
