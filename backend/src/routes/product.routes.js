const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');

// Get all products (public)
// Get all products (public)
router.post('/seed', async (req, res) => {
  try {
    const User = require('../models/user.model');
    // Using inline data to ensure it works remotely without file path issues
    const productsData = [
      {
        "name": "Champagne Satin Slip Dress",
        "description": "Elegant champagne gold satin slip dress with cowl neckline. Perfect for evening events and special occasions.",
        "price": 4999,
        "originalPrice": 6999,
        "category": "dress",
        "subcategory": "evening",
        "rating": 4.4,
        "reviews": 47,
        "inStock": true,
        "isNew": true,
        "image": "/images/dress-1.jpg",
        "colors": ["Champagne", "Black"],
        "sizes": ["XS", "S", "M", "L"]
      },
      {
        "name": "Powder Pink Blazer Dress",
        "description": "Trendy oversized blazer dress in powder pink with self-tie belt. Modern power dressing for the confident woman.",
        "price": 3999,
        "originalPrice": 5499,
        "category": "dress",
        "subcategory": "workwear",
        "rating": 4.8,
        "reviews": 510,
        "inStock": true,
        "isNew": false,
        "image": "/images/dress-2.jpg",
        "colors": ["Pink", "Navy"],
        "sizes": ["S", "M", "L"]
      },
      {
        "name": "Emerald Silk Wrap Dress",
        "description": "Stunning emerald green silk wrap dress with flowing silhouette. Elegant cocktail attire that turns heads.",
        "price": 5999,
        "originalPrice": 7999,
        "category": "dress",
        "subcategory": "cocktail",
        "rating": 4.7,
        "reviews": 543,
        "inStock": true,
        "isNew": false,
        "image": "/images/dress-3.jpg",
        "colors": ["Emerald", "Ruby"],
        "sizes": ["S", "M", "L"]
      },
      {
        "name": "Dusty Rose Puff Sleeve Dress",
        "description": "Romantic midi dress with puff sleeves in dusty rose. Feminine and flattering for any occasion.",
        "price": 3499,
        "originalPrice": 4499,
        "category": "dress",
        "subcategory": "casual",
        "rating": 4.9,
        "reviews": 107,
        "inStock": true,
        "isNew": false,
        "image": "/images/dress-4.jpg",
        "colors": ["Rose", "Lavender"],
        "sizes": ["S", "M", "L"]
      },
      {
        "name": "Classic Black Bodycon Dress",
        "description": "Sleek black bodycon dress that hugs your curves perfectly. A wardrobe essential for every woman.",
        "price": 2999,
        "originalPrice": 3999,
        "category": "dress",
        "subcategory": "evening",
        "rating": 4.7,
        "reviews": 559,
        "inStock": true,
        "isNew": true,
        "image": "/images/dress-5.jpg",
        "colors": ["Black", "Red"],
        "sizes": ["XS", "S", "M", "L"]
      }
    ];

    // 1. Get or Create Seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('seller123', 10);
      seller = await User.create({
        name: 'System Import Seller',
        email: 'seller_import@evara.com',
        password: hashedPassword,
        role: 'seller',
        isEmailVerified: true,
        sellerInfo: { businessName: 'Evara Imports' }
      });
    }

    // 2. Clear existing
    await Product.deleteMany({});

    // 3. Transform
    const productsToImport = productsData.map(p => ({
      name: p.name,
      description: p.description,
      shortDescription: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      subcategory: p.subcategory,
      images: [{ url: p.image, alt: p.name, isPrimary: true }],
      variants: {
        colors: p.colors ? p.colors.map(c => ({ name: c })) : [],
        sizes: p.sizes ? p.sizes.map(s => ({ name: s, inStock: true })) : []
      },
      rating: p.rating,
      reviewCount: p.reviews,
      isActive: true,
      inStock: p.inStock,
      isNew: p.isNew,
      seller: seller._id,
      stock: 50
    }));

    await Product.insertMany(productsToImport);

    res.json({
      success: true,
      message: `Successfully seeded ${productsToImport.length} products`,
      data: productsToImport
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

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
