const {
  UserActivity,
  PageVisit,
  SearchHistory,
  UserSession,
  AnalyticsSummary
} = require('../models/analytics.model');
const User = require('../models/user.model');
const Product = require('../models/product.model');

// Get dashboard overview
exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get today's stats
    const todayStats = await getStatsForDateRange(today, new Date());
    
    // Get last 30 days stats
    const thirtyDayStats = await getStatsForDateRange(thirtyDaysAgo, new Date());
    
    // Get user growth
    const userGrowth = await getUserGrowth(30);
    
    // Get top products
    const topProducts = await getTopProducts(10);
    
    // Get top searches
    const topSearches = await getTopSearches(10);
    
    // Get device breakdown
    const deviceBreakdown = await getDeviceBreakdown();
    
    // Get location breakdown
    const locationBreakdown = await getLocationBreakdown(10);
    
    // Get recent activity
    const recentActivity = await getRecentActivity(20);
    
    res.json({
      success: true,
      data: {
        today: todayStats,
        last30Days: thirtyDayStats,
        userGrowth,
        topProducts,
        topSearches,
        deviceBreakdown,
        locationBreakdown,
        recentActivity
      }
    });
    
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user analytics
exports.getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get user details
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get user activities
    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 }).limit(100);
    
    // Get page visits
    const pageVisits = await PageVisit.find({
      userId,
      entryTime: { $gte: startDate }
    }).sort({ entryTime: -1 });
    
    // Get searches
    const searches = await SearchHistory.find({
      userId,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });
    
    // Get sessions
    const sessions = await UserSession.find({
      userId,
      startTime: { $gte: startDate }
    }).sort({ startTime: -1 });
    
    // Calculate stats
    const totalTimeSpent = sessions.reduce((sum, s) => sum + (s.totalTimeSpent || 0), 0);
    const uniquePages = [...new Set(pageVisits.map(p => p.page))];
    
    res.json({
      success: true,
      data: {
        user: user.toPublicProfile(),
        summary: {
          totalActivities: activities.length,
          totalPageVisits: pageVisits.length,
          totalSearches: searches.length,
          totalSessions: sessions.length,
          totalTimeSpent,
          uniquePagesVisited: uniquePages.length,
          averageSessionTime: sessions.length > 0 ? Math.round(totalTimeSpent / sessions.length) : 0
        },
        activities,
        pageVisits,
        searches,
        sessions
      }
    });
    
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users with analytics
exports.getAllUsersAnalytics = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', role = '' } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    // Get analytics for each user
    const usersWithAnalytics = await Promise.all(
      users.map(async (user) => {
        const activityCount = await UserActivity.countDocuments({ userId: user._id });
        const lastActivity = await UserActivity.findOne({ userId: user._id })
          .sort({ timestamp: -1 });
        const sessionCount = await UserSession.countDocuments({ userId: user._id });
        
        return {
          ...user.toPublicProfile(),
          analytics: {
            activityCount,
            lastActivity: lastActivity?.timestamp,
            sessionCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: usersWithAnalytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('All users analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get search analytics
exports.getSearchAnalytics = async (req, res) => {
  try {
    const { days = 30, limit = 50 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get all searches
    const searches = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' },
          lastSearch: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    
    // Get searches with no results
    const noResultSearches = await SearchHistory.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate },
          $or: [
            { resultsCount: 0 },
            { resultsCount: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: '$query',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);
    
    res.json({
      success: true,
      data: {
        topSearches: searches,
        noResultSearches,
        totalSearches: await SearchHistory.countDocuments({
          timestamp: { $gte: startDate }
        })
      }
    });
    
  } catch (error) {
    console.error('Search analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get page analytics
exports.getPageAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get page views
    const pageViews = await PageVisit.aggregate([
      {
        $match: {
          entryTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$page',
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$userId' },
          avgTimeSpent: { $avg: '$timeSpent' }
        }
      },
      {
        $project: {
          page: '$_id',
          views: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          avgTimeSpent: { $round: ['$avgTimeSpent', 2] }
        }
      },
      {
        $sort: { views: -1 }
      }
    ]);
    
    res.json({
      success: true,
      data: pageViews
    });
    
  } catch (error) {
    console.error('Page analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get real-time stats
exports.getRealTimeStats = async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const [activeUsers, recentActivities, recentOrders] = await Promise.all([
      UserSession.countDocuments({
        isActive: true,
        lastActivity: { $gte: fiveMinutesAgo }
      }),
      UserActivity.find({
        timestamp: { $gte: fiveMinutesAgo }
      }).sort({ timestamp: -1 }).limit(10),
      // Order.find({ createdAt: { $gte: fiveMinutesAgo } }).countDocuments()
    ]);
    
    res.json({
      success: true,
      data: {
        activeUsers,
        recentActivities,
        recentOrders: 0 // Placeholder
      }
    });
    
  } catch (error) {
    console.error('Real-time stats error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper functions
async function getStatsForDateRange(startDate, endDate) {
  const [
    totalVisits,
    uniqueVisitors,
    newUsers,
    activeSessions
  ] = await Promise.all([
    PageVisit.countDocuments({
      entryTime: { $gte: startDate, $lte: endDate }
    }),
    PageVisit.distinct('userId', {
      entryTime: { $gte: startDate, $lte: endDate }
    }).then(users => users.length),
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    }),
    UserSession.countDocuments({
      startTime: { $gte: startDate, $lte: endDate }
    })
  ]);
  
  return {
    totalVisits,
    uniqueVisitors,
    newUsers,
    activeSessions
  };
}

async function getUserGrowth(days) {
  const growth = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const count = await User.countDocuments({
      createdAt: { $gte: date, $lt: nextDate }
    });
    
    growth.push({
      date: date.toISOString().split('T')[0],
      count
    });
  }
  
  return growth;
}

async function getTopProducts(limit) {
  return await Product.find()
    .select('name images price stats category')
    .sort({ 'stats.sales': -1 })
    .limit(limit);
}

async function getTopSearches(limit) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return await SearchHistory.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        query: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
}

async function getDeviceBreakdown() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const breakdown = await UserSession.aggregate([
    {
      $match: {
        startTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$device.type',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = { mobile: 0, tablet: 0, desktop: 0 };
  breakdown.forEach(item => {
    if (item._id) result[item._id] = item.count;
  });
  
  return result;
}

async function getLocationBreakdown(limit) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  return await PageVisit.aggregate([
    {
      $match: {
        entryTime: { $gte: startDate },
        'location.country': { $exists: true }
      }
    },
    {
      $group: {
        _id: '$location.country',
        visits: { $sum: 1 }
      }
    },
    {
      $sort: { visits: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        country: '$_id',
        visits: 1,
        _id: 0
      }
    }
  ]);
}

async function getRecentActivity(limit) {
  return await UserActivity.find()
    .populate('userId', 'name email')
    .sort({ timestamp: -1 })
    .limit(limit);
}
