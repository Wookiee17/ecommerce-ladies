const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All analytics routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard overview
router.get('/dashboard', analyticsController.getDashboardOverview);

// User analytics
router.get('/users/:userId', analyticsController.getUserAnalytics);
router.get('/users', analyticsController.getAllUsersAnalytics);

// Search analytics
router.get('/searches', analyticsController.getSearchAnalytics);

// Page analytics
router.get('/pages', analyticsController.getPageAnalytics);

// Real-time stats
router.get('/realtime', analyticsController.getRealTimeStats);

module.exports = router;
