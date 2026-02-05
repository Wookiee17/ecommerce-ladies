const Product = require('../models/product.model');
const User = require('../models/user.model');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Get seller dashboard
exports.getDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Get seller stats
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      totalViews,
      totalSales
    ] = await Promise.all([
      Product.countDocuments({ seller: sellerId }),
      Product.countDocuments({ seller: sellerId, isActive: true }),
      Product.countDocuments({ seller: sellerId, stock: 0 }),
      Product.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, totalViews: { $sum: '$stats.views' } } }
      ]).then(result => result[0]?.totalViews || 0),
      Product.aggregate([
        { $match: { seller: sellerId } },
        { $group: { _id: null, totalSales: { $sum: '$stats.sales' } } }
      ]).then(result => result[0]?.totalSales || 0)
    ]);
    
    // Get seller info
    const seller = await User.findById(sellerId).select('sellerInfo');
    
    // Get recent products
    const recentProducts = await Product.find({ seller: sellerId })
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get top performing products
    const topProducts = await Product.find({ seller: sellerId })
      .sort({ 'stats.sales': -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
          outOfStockProducts,
          totalViews,
          totalSales,
          totalEarnings: seller.sellerInfo?.totalEarnings || 0,
          commissionRate: seller.sellerInfo?.commissionRate || 10
        },
        sellerInfo: seller.sellerInfo,
        recentProducts,
        topProducts
      }
    });
    
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seller products
exports.getProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { page = 1, limit = 20, search = '', status = '', category = '' } = req.query;
    
    const query = { seller: sellerId };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (status === 'outofstock') query.stock = 0;
    if (category) query.category = category;
    
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
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
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single product
exports.getProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    
    const product = await Product.findOne({
      _id: productId,
      seller: sellerId
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      data: product
    });
    
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const productData = req.body;
    
    // Add seller ID
    productData.seller = sellerId;
    
    // Generate SKU if not provided
    if (!productData.sku) {
      const timestamp = Date.now().toString(36).toUpperCase();
      productData.sku = `EVR-${productData.category.substring(0, 3).toUpperCase()}-${timestamp}`;
    }
    
    // Create product
    const product = new Product(productData);
    await product.save();
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
    
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    const updates = req.body;
    
    // Find product and verify ownership
    const product = await Product.findOne({
      _id: productId,
      seller: sellerId
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Update product
    Object.assign(product, updates);
    await product.save();
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const sellerId = req.user._id;
    
    const product = await Product.findOneAndDelete({
      _id: productId,
      seller: sellerId
    });
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Upload product images
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }
    
    const imageUrls = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      alt: file.originalname,
      isPrimary: false
    }));
    
    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: imageUrls
    });
    
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk upload products from Excel/CSV
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const sellerId = req.user._id;
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    
    let products = [];
    
    if (fileExt === '.xlsx' || fileExt === '.xls') {
      // Parse Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      products = xlsx.utils.sheet_to_json(worksheet);
    } else if (fileExt === '.csv') {
      // Parse CSV
      products = await parseCSV(filePath);
    } else if (fileExt === '.json') {
      // Parse JSON
      const data = fs.readFileSync(filePath, 'utf8');
      products = JSON.parse(data);
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file format' });
    }
    
    // Validate and process products
    const results = {
      success: [],
      failed: []
    };
    
    for (const productData of products) {
      try {
        // Validate required fields
        if (!productData.name || !productData.price || !productData.category) {
          results.failed.push({
            data: productData,
            error: 'Missing required fields (name, price, category)'
          });
          continue;
        }
        
        // Add seller ID and generate SKU
        productData.seller = sellerId;
        if (!productData.sku) {
          const timestamp = Date.now().toString(36).toUpperCase();
          productData.sku = `EVR-${productData.category.substring(0, 3).toUpperCase()}-${timestamp}`;
        }
        
        // Create product
        const product = new Product(productData);
        await product.save();
        
        results.success.push(product);
      } catch (error) {
        results.failed.push({
          data: productData,
          error: error.message
        });
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: `Bulk upload completed. ${results.success.length} products created, ${results.failed.length} failed.`,
      data: results
    });
    
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Download sample template
exports.downloadTemplate = async (req, res) => {
  try {
    const format = req.query.format || 'xlsx';
    
    const sampleData = [
      {
        name: 'Sample Dress',
        description: 'A beautiful sample dress',
        shortDescription: 'Sample dress description',
        price: 2999,
        originalPrice: 3999,
        category: 'dress',
        subcategory: 'evening',
        stock: 50,
        colors: 'Red,Blue,Black',
        sizes: 'S,M,L,XL',
        material: 'Cotton',
        careInstructions: 'Hand wash only',
        tags: 'dress,evening,formal'
      },
      {
        name: 'Sample Jewelry',
        description: 'Elegant sample jewelry piece',
        shortDescription: 'Sample jewelry description',
        price: 4999,
        originalPrice: 5999,
        category: 'jewelry',
        subcategory: 'necklace',
        stock: 20,
        colors: 'Gold,Silver',
        sizes: 'One Size',
        material: 'Gold Plated',
        careInstructions: 'Keep away from water',
        tags: 'jewelry,necklace,gold'
      },
      {
        name: 'Sample Beauty Device',
        description: 'Advanced beauty device',
        shortDescription: 'Sample beauty device description',
        price: 9999,
        originalPrice: 12999,
        category: 'beauty',
        subcategory: 'skincare-devices',
        stock: 30,
        colors: 'White,Rose Gold',
        sizes: 'One Size',
        material: 'Plastic',
        warranty: '1 year warranty',
        tags: 'beauty,skincare,device'
      }
    ];
    
    if (format === 'xlsx') {
      const worksheet = xlsx.utils.json_to_sheet(sampleData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Products');
      
      const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=evara-product-template.xlsx');
      res.send(buffer);
      
    } else if (format === 'csv') {
      const worksheet = xlsx.utils.json_to_sheet(sampleData);
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=evara-product-template.csv');
      res.send(csv);
      
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=evara-product-template.json');
      res.json(sampleData);
    }
    
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get seller profile
exports.getProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    const seller = await User.findById(sellerId).select('-password');
    
    res.json({
      success: true,
      data: seller.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update seller profile
exports.updateProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const updates = req.body;
    
    // Only allow updating seller-specific fields
    const allowedUpdates = {
      name: updates.name,
      phone: updates.phone,
      'sellerInfo.businessName': updates.businessName,
      'sellerInfo.businessEmail': updates.businessEmail,
      'sellerInfo.businessPhone': updates.businessPhone,
      'sellerInfo.gstNumber': updates.gstNumber,
      'sellerInfo.panNumber': updates.panNumber,
      'sellerInfo.bankAccount': updates.bankAccount
    };
    
    const seller = await User.findByIdAndUpdate(
      sellerId,
      { $set: allowedUpdates },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: seller.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Update seller profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to parse CSV
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
