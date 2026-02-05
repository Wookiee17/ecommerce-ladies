const Review = require('../models/review.model');
const Product = require('../models/product.model');
const { sendEmail } = require('../utils/email.service');
const { createNotification } = require('../utils/notification.service');

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, images, verified } = req.body;
    const userId = req.user._id;

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = new Review({
      productId,
      userId,
      rating,
      title,
      comment,
      images: images || [],
      verified: verified || false,
      helpful: 0,
      reported: false
    });

    await review.save();

    // Update product rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: reviews.length
    });

    // Notify admin/seller of new review
    const product = await Product.findById(productId);
    if (product) {
      await createNotification({
        userId: product.sellerId || null,
        type: 'review',
        title: 'New Product Review',
        message: `Your product "${product.name}" received a ${rating}-star review`,
        data: { productId, reviewId: review._id, rating }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    let sortQuery = {};
    switch (sort) {
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'oldest':
        sortQuery = { createdAt: 1 };
        break;
      case 'highest':
        sortQuery = { rating: -1 };
        break;
      case 'lowest':
        sortQuery = { rating: 1 };
        break;
      case 'helpful':
        sortQuery = { helpful: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const reviews = await Review.find({ productId })
      .populate('userId', 'name avatar')
      .sort(sortQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ productId });

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { productId: require('mongoose').Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratingStats.forEach(stat => {
      distribution[stat._id] = stat.count;
    });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        },
        distribution
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error.message
    });
  }
};

// Update a review
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, images } = req.body;
    const userId = req.user._id;

    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    review.rating = rating || review.rating;
    review.title = title || review.title;
    review.comment = comment || review.comment;
    review.images = images || review.images;
    review.updatedAt = Date.now();

    await review.save();

    // Recalculate product rating
    const reviews = await Review.find({ productId: review.productId });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await Product.findByIdAndUpdate(review.productId, {
      rating: Math.round(avgRating * 10) / 10
    });

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review',
      error: error.message
    });
  }
};

// Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    const query = isAdmin ? { _id: reviewId } : { _id: reviewId, userId };
    const review = await Review.findOne(query);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or unauthorized'
      });
    }

    const productId = review.productId;
    await Review.deleteOne({ _id: reviewId });

    // Recalculate product rating
    const reviews = await Review.find({ productId });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(avgRating * 10) / 10,
      reviews: reviews.length
    });

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error.message
    });
  }
};

// Mark review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const alreadyMarked = review.helpfulUsers.includes(userId);
    if (alreadyMarked) {
      review.helpfulUsers = review.helpfulUsers.filter(id => id.toString() !== userId.toString());
      review.helpful -= 1;
    } else {
      review.helpfulUsers.push(userId);
      review.helpful += 1;
    }

    await review.save();

    res.json({
      success: true,
      message: alreadyMarked ? 'Helpful mark removed' : 'Marked as helpful',
      data: { helpful: review.helpful }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark helpful',
      error: error.message
    });
  }
};

// Report a review
exports.reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.reported = true;
    review.reportReason = reason;
    review.reportedBy = userId;
    review.reportedAt = Date.now();

    await review.save();

    // Notify admin
    await createNotification({
      userId: null, // Admin notification
      type: 'report',
      title: 'Review Reported',
      message: `A review has been reported for: ${reason}`,
      data: { reviewId, reportedBy: userId, reason }
    });

    res.json({
      success: true,
      message: 'Review reported successfully'
    });
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review',
      error: error.message
    });
  }
};

// Get user's reviews
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ userId })
      .populate('productId', 'name image price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reviews',
      error: error.message
    });
  }
};

// Share review link via email
exports.shareReviewLink = async (req, res) => {
  try {
    const { productId, emails, message } = req.body;
    const userId = req.user._id;
    const user = req.user;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const reviewLink = `${process.env.FRONTEND_URL}/product/${productId}?review=true`;
    const customMessage = message || `Hi! I'd love to hear your thoughts on ${product.name}. Please leave a review here:`;

    const emailPromises = emails.map(email => 
      sendEmail({
        to: email,
        subject: `Please review ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Product Review Request</h2>
            <p>${customMessage}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reviewLink}" 
                 style="background: #ec4899; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Write a Review
              </a>
            </div>
            <div style="border: 1px solid #eee; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; float: left; margin-right: 15px;" />
              <h3 style="margin: 0; color: #333;">${product.name}</h3>
              <p style="color: #666; margin: 5px 0;">₹${product.price}</p>
            </div>
            <p style="color: #999; font-size: 12px;">Sent by ${user.name} via Evara</p>
          </div>
        `
      })
    );

    await Promise.all(emailPromises);

    res.json({
      success: true,
      message: `Review link shared with ${emails.length} recipient(s)`
    });
  } catch (error) {
    console.error('Share review link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share review link',
      error: error.message
    });
  }
};

// Admin: Get all reported reviews
exports.getReportedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({ reported: true })
      .populate('productId', 'name image')
      .populate('userId', 'name email')
      .populate('reportedBy', 'name')
      .sort({ reportedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ reported: true });

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reported reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reported reviews',
      error: error.message
    });
  }
};

// Admin: Moderate review
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, reason } = req.body; // action: 'approve', 'reject', 'remove'

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (action === 'remove') {
      await Review.deleteOne({ _id: reviewId });
      
      // Recalculate product rating
      const reviews = await Review.find({ productId: review.productId });
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;
      
      await Product.findByIdAndUpdate(review.productId, {
        rating: Math.round(avgRating * 10) / 10,
        reviews: reviews.length
      });

      return res.json({
        success: true,
        message: 'Review removed successfully'
      });
    }

    review.moderated = true;
    review.moderationAction = action;
    review.moderationReason = reason;
    review.moderatedAt = Date.now();
    review.moderatedBy = req.user._id;

    if (action === 'approve') {
      review.reported = false;
    }

    await review.save();

    res.json({
      success: true,
      message: `Review ${action}ed successfully`,
      data: review
    });
  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review',
      error: error.message
    });
  }
};
