const mongoose = require('mongoose');

const userTryOnSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    userPhoto: {
        imageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image'
        },
        url: String,
        uploadedAt: Date
    },
    generatedImages: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        imageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Image'
        },
        url: String,
        generatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    rateLimit: {
        count: {
            type: Number,
            default: 0
        },
        windowStart: {
            type: Date,
            default: Date.now
        }
    }
}, {
    timestamps: true
});

// Index for fast userId lookups
userTryOnSchema.index({ userId: 1 });

// Static method: Check if user can generate
userTryOnSchema.statics.checkRateLimit = async function (userId) {
    const RATE_LIMIT = 10; // 10 generations
    const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    let userTryOn = await this.findOne({ userId });

    if (!userTryOn) {
        return {
            allowed: true,
            remaining: RATE_LIMIT,
            resetAt: new Date(Date.now() + WINDOW_MS)
        };
    }

    const now = Date.now();
    const windowStart = userTryOn.rateLimit?.windowStart?.getTime() || now;
    const windowEnd = windowStart + WINDOW_MS;

    // Reset if window expired
    if (now >= windowEnd) {
        userTryOn.rateLimit.count = 0;
        userTryOn.rateLimit.windowStart = new Date(now);
        await userTryOn.save();

        return {
            allowed: true,
            remaining: RATE_LIMIT,
            resetAt: new Date(now + WINDOW_MS)
        };
    }

    // Check if within limit
    const remaining = RATE_LIMIT - (userTryOn.rateLimit?.count || 0);

    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
        resetAt: new Date(windowEnd)
    };
};

// Static method: Increment generation count
userTryOnSchema.statics.incrementGeneration = async function (userId) {
    const userTryOn = await this.findOne({ userId });

    if (!userTryOn) {
        // Create new record
        await this.create({
            userId,
            rateLimit: {
                count: 1,
                windowStart: new Date()
            }
        });
    } else {
        userTryOn.rateLimit.count = (userTryOn.rateLimit.count || 0) + 1;
        await userTryOn.save();
    }
};

module.exports = mongoose.model('UserTryOn', userTryOnSchema);
