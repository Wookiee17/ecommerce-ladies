const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const sellerController = require('../controllers/seller.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|xlsx|xls|csv|json/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// All seller routes require seller authentication
router.use(authenticate);
router.use(authorize('seller', 'admin'));

// Dashboard
router.get('/dashboard', sellerController.getDashboard);

// Profile
router.get('/profile', sellerController.getProfile);
router.put('/profile', sellerController.updateProfile);

// Products
router.get('/products', sellerController.getProducts);
router.get('/products/:productId', sellerController.getProduct);
router.post('/products', sellerController.createProduct);
router.put('/products/:productId', sellerController.updateProduct);
router.delete('/products/:productId', sellerController.deleteProduct);

// Image upload
router.post('/upload-images', upload.array('images', 10), sellerController.uploadImages);

// Bulk upload
router.post('/bulk-upload', upload.single('file'), sellerController.bulkUpload);
router.get('/template', sellerController.downloadTemplate);

module.exports = router;
