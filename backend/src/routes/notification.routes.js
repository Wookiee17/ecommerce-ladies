const express = require('express');
const router = express.Router();
const { triggerDailyNotifications } = require('../jobs/notificationJob');
const Notification = require('../models/notification.model');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Get user notifications
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    const filter = { user: userId };
    if (unreadOnly === 'true') {
      filter.read = false;
    }
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Notification.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
    
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Notification.updateMany(
      { user: userId, read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/:notificationId', authenticate, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId
    });
    
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread notification count
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Notification.countDocuments({
      user: userId,
      read: false
    });
    
    res.json({
      success: true,
      data: { unreadCount: count }
    });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Trigger daily notifications (admin only)
router.post('/trigger-daily', authenticate, authorize('admin'), async (req, res) => {
  try {
    await triggerDailyNotifications();
    
    res.json({
      success: true,
      message: 'Daily notifications triggered successfully'
    });
    
  } catch (error) {
    console.error('Trigger daily notifications error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
