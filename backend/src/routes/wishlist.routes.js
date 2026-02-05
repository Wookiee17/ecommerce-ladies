const express = require('express');
const router = express.Router();
const { authenticate: auth } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Get wishlist
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('wishlist');
        res.json({
            success: true,
            data: user.wishlist
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add to wishlist
router.post('/add', auth, async (req, res) => {
    try {
        const { productId } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const user = await User.findById(req.user._id);

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ success: false, message: 'Product already in wishlist' });
        }

        user.wishlist.push(productId);
        await user.save();

        // Populate and return
        await user.populate('wishlist');

        res.json({
            success: true,
            message: 'Product added to wishlist',
            data: user.wishlist
        });

    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Remove from wishlist
router.delete('/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user._id);

        user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
        await user.save();

        await user.populate('wishlist');

        res.json({
            success: true,
            message: 'Product removed from wishlist',
            data: user.wishlist
        });

    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
