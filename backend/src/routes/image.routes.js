const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Image = require('../../models/image.model');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

// Test route to verify router is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Image routes working', timestamp: new Date().toISOString() });
});

// Check DB connection and image count
router.get('/check-db', async (req, res) => {
  try {
    const count = await Image.countDocuments();
    // Try to find first image
    const firstImage = await Image.findOne().lean();
    res.json({ 
      message: 'DB check',
      imageCount: count,
      firstImageId: firstImage ? firstImage._id.toString() : null,
      firstImageFilename: firstImage ? firstImage.filename : null,
      mongooseConnected: mongoose.connection.readyState === 1
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP are allowed.'));
    }
  }
});

// Upload single image
router.post('/upload', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const image = new Image({
      filename: req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      category: req.body.category || 'product',
      productId: req.body.productId || null,
      isPrimary: req.body.isPrimary === 'true',
      uploadedBy: req.user._id
    });

    await image.save();

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: image._id,
        filename: image.filename,
        url: `/api/images/${image._id}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload multiple images
router.post('/upload-multiple', authenticate, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const images = await Promise.all(req.files.map(async (file, index) => {
      const image = new Image({
        filename: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        data: file.buffer,
        category: req.body.category || 'product',
        productId: req.body.productId || null,
        isPrimary: req.body.isPrimary || (index === 0),
        uploadedBy: req.user._id
      });
      return image.save();
    }));

    res.json({
      success: true,
      message: `${images.length} images uploaded successfully`,
      data: images.map(img => ({
        id: img._id,
        filename: img.filename,
        url: `/api/images/${img._id}`
      }))
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get image by ID
router.get('/:imageId', optionalAuth, async (req, res) => {
  try {
    console.log('DEBUG - Looking for image:', req.params.imageId);
    const image = await Image.findById(req.params.imageId).lean();
    
    if (!image) {
      console.log('DEBUG - Image not found in DB');
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    console.log('DEBUG - Image found:', image.filename);
    console.log('DEBUG - Data type:', typeof image.data);
    console.log('DEBUG - Is Buffer:', Buffer.isBuffer(image.data));
    console.log('DEBUG - Data keys:', image.data ? Object.keys(image.data) : 'none');
    console.log('DEBUG - _bsontype:', image.data?._bsontype);

    // Handle MongoDB Binary data
    let imageData = image.data;
    
    // If it's a Mongoose Binary/BSON type, extract the buffer
    if (imageData && typeof imageData === 'object' && imageData._bsontype === 'Binary') {
      imageData = imageData.buffer || imageData.read(0, imageData.length());
    }
    
    // Ensure it's a proper Buffer
    if (!Buffer.isBuffer(imageData)) {
      imageData = Buffer.from(imageData);
    }

    console.log('DEBUG - Final data length:', imageData.length);
    console.log('DEBUG - First 4 bytes:', imageData.slice(0, 4).toString('hex'));

    res.set('Content-Type', image.mimeType || 'image/jpeg');
    res.set('Content-Length', imageData.length);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.end(imageData);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ success: false, message: 'Image not found' });
  }
});

// Get images by category
router.get('/list/:category', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const query = { category: req.params.category };
    if (req.params.category === 'product' && req.query.productId) {
      query.productId = req.query.productId;
    }

    const [images, total] = await Promise.all([
      Image.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .select('-data'), // Exclude binary data for list view
      Image.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: images.map(img => ({
        id: img._id,
        filename: img.filename,
        originalName: img.originalName,
        mimeType: img.mimeType,
        size: img.size,
        category: img.category,
        productId: img.productId,
        isPrimary: img.isPrimary,
        url: `/api/images/${img._id}`,
        createdAt: img.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete image
router.delete('/:imageId', authenticate, async (req, res) => {
  try {
    console.log('DEBUG - Deleting image:', req.params.imageId);
    const image = await Image.findByIdAndDelete(req.params.imageId);
    
    if (!image) {
      console.log('DEBUG - Image not found');
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    console.log('DEBUG - Image deleted');

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
