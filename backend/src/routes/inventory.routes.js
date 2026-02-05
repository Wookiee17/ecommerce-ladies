const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const Product = require('../models/product.model');

// Admin: get low stock products across all sellers
router.get('/admin/low-stock', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 50;

    const filter = {
      $or: [
        { stock: { $lte: 0 } },
        {
          stock: { $gt: 0 },
          $expr: { $lte: ['$stock', '$lowStockThreshold'] }
        }
      ]
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ stock: 1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Get admin low stock products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seller: get low stock products for current seller
router.get('/seller/low-stock', authenticate, authorize('seller'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const numericPage = parseInt(page, 10) || 1;
    const numericLimit = parseInt(limit, 10) || 50;

    const filter = {
      seller: req.user._id,
      $or: [
        { stock: { $lte: 0 } },
        {
          stock: { $gt: 0 },
          $expr: { $lte: ['$stock', '$lowStockThreshold'] }
        }
      ]
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ stock: 1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        pages: Math.ceil(total / numericLimit)
      }
    });
  } catch (error) {
    console.error('Get seller low stock products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seller: get simple auto-restock suggestions based on current stock and threshold
router.get('/seller/restock-suggestions', authenticate, authorize('seller'), async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id, stock: { $gte: 0 } })
      .select('name stock lowStockThreshold stats');

    const suggestions = products.map((product) => {
      const targetStock = Math.max(product.lowStockThreshold * 3, 10);
      const suggestedQty = Math.max(targetStock - product.stock, 0);

      return {
        productId: product._id,
        name: product.name,
        currentStock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        suggestedReorderQuantity: suggestedQty,
        totalSales: product.stats?.sales || 0
      };
    }).filter((s) => s.suggestedReorderQuantity > 0);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Get restock suggestions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin: update per-product warehouse configuration
router.put('/admin/products/:productId/warehouses', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { productId } = req.params;
    const { warehouses } = req.body;

    if (!Array.isArray(warehouses)) {
      return res.status(400).json({ success: false, message: 'warehouses must be an array' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.warehouses = warehouses;
    // Optionally sync total stock with sum of warehouse stock
    const totalStock = warehouses.reduce((sum, w) => sum + (w.stock || 0), 0);
    product.stock = totalStock;

    await product.save();

    res.json({
      success: true,
      message: 'Warehouses updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product warehouses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

