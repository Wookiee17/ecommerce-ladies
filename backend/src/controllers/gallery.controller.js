const TryOnGallery = require('../models/tryOnGallery.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Save try-on to gallery
exports.saveToGallery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, imageUrl } = req.body;

        if (!productId || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: 'Product ID and image URL are required'
            });
        }

        // Get user info for display name
        const user = await User.findById(userId);
        const userName = user?.name || user?.email?.split('@')[0] || 'Anonymous';
        const userAvatar = user?.avatar;

        // Check if already saved
        const existing = await TryOnGallery.findOne({ userId, productId });
        if (existing) {
            // Update existing
            existing.imageUrl = imageUrl;
            existing.savedAt = new Date();
            await existing.save();

            return res.json({
                success: true,
                message: 'Gallery image updated',
                data: existing
            });
        }

        // Create new gallery entry
        const galleryItem = await TryOnGallery.create({
            userId,
            productId,
            imageUrl,
            userName,
            userAvatar,
            isPublic: true
        });

        res.status(201).json({
            success: true,
            message: 'Saved to gallery',
            data: galleryItem
        });

    } catch (error) {
        console.error('Save to gallery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save to gallery'
        });
    }
};

// Get user's gallery
exports.getMyGallery = async (req, res) => {
    try {
        const userId = req.user.id;

        const galleryItems = await TryOnGallery.find({ userId })
            .sort({ savedAt: -1 })
            .populate('productId', 'name images price category')
            .lean();

        // Format response
        const formatted = galleryItems.map(item => ({
            id: item._id,
            imageUrl: item.imageUrl,
            savedAt: item.savedAt,
            isPublic: item.isPublic,
            product: item.productId ? {
                id: item.productId._id,
                name: item.productId.name,
                image: item.productId.images?.[0]?.url || item.productId.images?.[0] || '',
                price: item.productId.price,
                category: item.productId.category
            } : null
        }));

        res.json({
            success: true,
            data: formatted
        });

    } catch (error) {
        console.error('Get gallery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch gallery'
        });
    }
};

// Get public try-ons for a product (community gallery)
exports.getProductGallery = async (req, res) => {
    try {
        const { productId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const galleryItems = await TryOnGallery.find({
            productId,
            isPublic: true
        })
            .sort({ savedAt: -1 })
            .limit(limit)
            .lean();

        // Format response
        const formatted = galleryItems.map(item => ({
            id: item._id,
            imageUrl: item.imageUrl,
            userName: item.userName,
            userAvatar: item.userAvatar,
            savedAt: item.savedAt
        }));

        res.json({
            success: true,
            data: formatted
        });

    } catch (error) {
        console.error('Get product gallery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product gallery'
        });
    }
};

// Delete from gallery
exports.deleteFromGallery = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await TryOnGallery.findOneAndDelete({
            _id: id,
            userId
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        res.json({
            success: true,
            message: 'Removed from gallery'
        });

    } catch (error) {
        console.error('Delete gallery error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete from gallery'
        });
    }
};

// Toggle public visibility
exports.togglePublic = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const item = await TryOnGallery.findOne({ _id: id, userId });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Gallery item not found'
            });
        }

        item.isPublic = !item.isPublic;
        await item.save();

        res.json({
            success: true,
            message: item.isPublic ? 'Now visible to others' : 'Now private',
            data: { isPublic: item.isPublic }
        });

    } catch (error) {
        console.error('Toggle public error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update visibility'
        });
    }
};
