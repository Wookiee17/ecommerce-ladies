const User = require('../models/user.model');
const Product = require('../models/product.model');
const { UserActivity, AnalyticsSummary } = require('../models/analytics.model');

// Get admin dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get counts
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      newUsersToday,
      pendingSellers,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'seller' }),
      Product.countDocuments(),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ role: 'seller', 'sellerInfo.verificationStatus': 'pending' }),
      Product.countDocuments({ stock: { $lt: 10 } })
    ]);
    
    // Get recent users
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get recent sellers
    const recentSellers = await User.find({ role: 'seller' })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get pending seller verifications
    const pendingVerifications = await User.find({
      role: 'seller',
      'sellerInfo.verificationStatus': 'pending'
    }).select('-password').limit(10);
    
    // Get sales data (placeholder - implement with Order model)
    const salesData = {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      total: 0
    };
    
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalSellers,
          totalProducts,
          newUsersToday,
          pendingSellers,
          lowStockProducts,
          sales: salesData
        },
        recentUsers,
        recentSellers,
        pendingVerifications
      }
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '', status = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get user activity summary
    const activityCount = await UserActivity.countDocuments({ userId });
    const lastActivity = await UserActivity.findOne({ userId })
      .sort({ timestamp: -1 });
    
    res.json({
      success: true,
      data: {
        user,
        activitySummary: {
          totalActivities: activityCount,
          lastActivity: lastActivity?.timestamp
        }
      }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    // Prevent updating sensitive fields
    delete updates.password;
    delete updates._id;
    
    const user = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all sellers
exports.getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '' } = req.query;
    
    const query = { role: 'seller' };
    if (status) query['sellerInfo.verificationStatus'] = status;
    
    const sellers = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: sellers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get all sellers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify seller
exports.verifySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, reason } = req.body; // status: 'approved' or 'rejected'
    
    const seller = await User.findById(sellerId);
    
    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }
    
    seller.sellerInfo.verificationStatus = status;
    seller.sellerInfo.isVerified = status === 'approved';
    
    if (reason) {
      seller.sellerInfo.rejectionReason = reason;
    }
    
    await seller.save();
    
    res.json({
      success: true,
      message: `Seller ${status} successfully`,
      data: seller.toPublicProfile()
    });
    
  } catch (error) {
    console.error('Verify seller error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all products (admin view)
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', category = '', status = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    
    const products = await Product.find(query)
      .populate('seller', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updates = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      updates,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
    
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findByIdAndDelete(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get system settings
exports.getSettings = async (req, res) => {
  try {
    // Return system settings
    res.json({
      success: true,
      data: {
        siteName: 'Evara',
        maintenanceMode: false,
        allowRegistration: true,
        allowSellerRegistration: true,
        defaultCommissionRate: 10,
        freeShippingThreshold: 999,
        currency: 'INR',
        timezone: 'Asia/Kolkata'
      }
    });
    
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update system settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Update settings in database or config
    // This is a placeholder - implement with actual settings storage
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updates
    });
    
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
