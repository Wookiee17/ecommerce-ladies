const Notification = require('../models/notification.model');
const { sendEmail } = require('./email.service');

// Send notification to user
exports.sendNotification = async ({ userId, type, title, message, data = {} }) => {
  try {
    // Save to database
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      data,
      read: false
    });
    await notification.save();

    // Send push notification (if FCM configured)
    if (process.env.FCM_SERVER_KEY) {
      await sendPushNotification(userId, { title, message, data });
    }

    return { success: true, notification };
  } catch (error) {
    console.error('Notification error:', error);
    return { success: false, error };
  }
};

// Send bulk notification
exports.sendBulkNotification = async ({ userIds, type, title, message, data = {} }) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      type,
      title,
      message,
      data,
      read: false
    }));

    await Notification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Bulk notification error:', error);
    return { success: false, error };
  }
};

// Get user notifications
exports.getUserNotifications = async (userId, { page = 1, limit = 20 }) => {
  try {
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false
    });

    return { success: true, notifications, unreadCount };
  } catch (error) {
    return { success: false, error };
  }
};

// Mark notification as read
exports.markAsRead = async (notificationId, userId) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true, readAt: new Date() }
    );
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Send email notification
exports.sendEmailNotification = async ({ to, template, data }) => {
  const templates = {
    order_placed: { subject: 'Order Placed Successfully', template: 'order-confirmation' },
    order_shipped: { subject: 'Your Order Has Been Shipped', template: 'order-shipped' },
    order_delivered: { subject: 'Order Delivered', template: 'order-delivered' },
    seller_welcome: { subject: 'Welcome to Evara Seller Program', template: 'seller-welcome' },
    product_approved: { subject: 'Product Approved', template: 'product-approved' },
    low_stock: { subject: 'Low Stock Alert', template: 'low-stock' }
  };

  const emailConfig = templates[template];
  if (!emailConfig) return { success: false, error: 'Template not found' };

  return await sendEmail({
    to,
    subject: emailConfig.subject,
    template: emailConfig.template,
    data
  });
};

async function sendPushNotification(userId, payload) {
  // Implement FCM push notification
  // Requires firebase-admin setup
}
