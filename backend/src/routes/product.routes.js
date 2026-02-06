const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { trackUserActivity } = require('../middleware/analytics.middleware');
const { optionalAuth } = require('../middleware/auth.middleware');

// Get all products (public)
// Get all products (public)
// Get all products (public)
router.post('/seed', async (req, res) => {
  try {
    const User = require('../models/user.model');
    const bcrypt = require('bcryptjs');

    const CATEGORIES = ['dress', 'jewelry', 'beauty'];
    const ADJECTIVES = ['Elegant', 'Modern', 'Classic', 'Vintage', 'Chic', 'Luxury', 'Minimalist', 'Bohemian', 'Urban', 'Sophisticated'];
    const NOUNS = {
      'dress': ['Evening Gown', 'Summer Dress', 'Cocktail Dress', 'Maxi Dress', 'Sundress', 'Party Dress', 'Wrap Dress'],
      'jewelry': ['Necklace', 'Earrings', 'Bracelet', 'Ring', 'Pendant', 'Choker', 'Anklet'],
      'beauty': ['Lipstick', 'Serum', 'Moisturizer', 'Foundation', 'Perfume', 'Eye Shadow', 'Mascara']
    };

    // Base images - jewelry and beauty use local images, dresses use working external URLs
    const getLocalImage = (category, index) => {
      const num = (index % 50) + 1; // Cycle through 1-50
      const cacheBust = Date.now(); // Force cache refresh
      
      // Dress images currently contain shoes (wrong content), use picsum.photos with seeds
      if (category === 'dress') {
        // Using fashion/dress related images from pexels
        const dressImages = [
          `https://images.pexels.com/photos/1624051/pexels-photo-1624051.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1144834/pexels-photo-1144834.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1078958/pexels-photo-1078958.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1381556/pexels-photo-1381556.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1036622/pexels-photo-1036622.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1557843/pexels-photo-1557843.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`,
          `https://images.pexels.com/photos/1163194/pexels-photo-1163194.jpeg?auto=compress&cs=tinysrgb&w=500&cb=${cacheBust}`
        ];
        return dressImages[index % dressImages.length];
      }
      
      // Jewelry and beauty use local images
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return `${frontendUrl}/images/${category}-${num}.jpg?cb=${cacheBust}`;
    };

    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // 1. Get or Create Seller
    let seller = await User.findOne({ role: 'seller' });
    if (!seller) {
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

    // 3. Generate Data
    const productsToImport = [];

    for (const category of CATEGORIES) {
      for (let i = 0; i < 50; i++) {
        const adjective = random(ADJECTIVES);
        const noun = random(NOUNS[category]);
        const name = `${adjective} ${noun} ${randomNum(1, 999)}`;
        const color = random(['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver', 'Navy', 'Pink', 'Purple']);

        const product = {
          name: name,
          description: `This is a beautiful ${name.toLowerCase()}. Perfect for any occasion. Made with high-quality materials.`,
          shortDescription: `A ${adjective.toLowerCase()} ${noun.toLowerCase()} for you.`,
          price: randomNum(500, 15000),
          originalPrice: randomNum(16000, 25000),
          category: category,
          subcategory: category === 'dress' ? (i % 2 === 0 ? 'casual' : 'formal') : 'general',
          images: [
            {
              url: getLocalImage(category, i),
              alt: `${name} - Front View`,
              isPrimary: true
            },
            {
              url: getLocalImage(category, i + 1),
              alt: `${name} - Side View`,
              isPrimary: false
            },
            {
              url: getLocalImage(category, i + 2),
              alt: `${name} - Detail View`,
              isPrimary: false
            }
          ],
          variants: {
            colors: category === 'dress'
              ? [{ name: color }, { name: 'Black' }] // Ensure the main color matches image
              : [{ name: color }],
            sizes: category === 'dress'
              ? [{ name: 'S', inStock: true }, { name: 'M', inStock: true }, { name: 'L', inStock: true }]
              : [{ name: 'One Size', inStock: true }]
          },
          rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 - 5.0
          reviewCount: randomNum(0, 500),
          isActive: true,
          inStock: true,
          stock: randomNum(10, 100),
          isNew: Math.random() > 0.8,
          isBestseller: Math.random() > 0.8,
          seller: seller._id
        };
        productsToImport.push(product);
      }
    }

    await Product.insertMany(productsToImport);

    res.json({
      success: true,
      message: `Successfully seeded ${productsToImport.length} products (50 per category: Dress, Jewelry, Beauty)`,
      count: productsToImport.length
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

    if (category) query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    if (subcategory) query.subcategory = { $regex: new RegExp(`^${subcategory}$`, 'i') };
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

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'name sellerInfo.businessName')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort(sort)
        .lean(), // Use lean() for faster read-only performance
      Product.countDocuments(query)
    ]);

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

// Get random suggestions
router.get('/suggestions/list', async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 10 } }
    ]);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
