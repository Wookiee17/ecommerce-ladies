const mongoose = require('mongoose');

const tryOnGallerySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        default: 'Anonymous'
    },
    userAvatar: {
        type: String
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    savedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for fast lookups
tryOnGallerySchema.index({ userId: 1, savedAt: -1 });
tryOnGallerySchema.index({ productId: 1, isPublic: 1, savedAt: -1 });
tryOnGallerySchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('TryOnGallery', tryOnGallerySchema);
