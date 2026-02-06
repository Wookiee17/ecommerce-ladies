const express = require('express');
const router = express.Router();
const multer = require('multer');
const Image = require('../../models/image.model');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

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
    const image = await Image.findById(req.params.imageId);
    
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

    res.set('Content-Type', image.mimeType);
    res.set('Content-Length', image.size);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(image.data);
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
    const image = await Image.findByIdAndDelete(req.params.imageId);
    
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }

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
