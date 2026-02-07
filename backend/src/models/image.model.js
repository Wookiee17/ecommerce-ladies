const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number
    },
    data: {
        type: Buffer,
        required: true
    },
    category: {
        type: String,
        enum: ['product', 'user', 'tryon', 'other'],
        default: 'other'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for faster queries
imageSchema.index({ category: 1, productId: 1 });
imageSchema.index({ uploadedBy: 1 });

module.exports = mongoose.models.Image ||
    mongoose.model('Image', imageSchema);
