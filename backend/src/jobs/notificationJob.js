const cron = require('node-cron');
const User = require('../models/user.model');
const Product = require('../models/product.model');
const Notification = require('../models/notification.model');
const { sendCartReminderEmail, sendProductSuggestionsEmail } = require('../utils/emailService');

// Daily notification job - runs every day at 10 AM
const dailyNotificationJob = cron.schedule('0 10 * * *', async () => {
  console.log('📧 Starting daily notification job...');
  
  try {
    await sendCartReminders();
    await sendProductSuggestions();
    
    console.log('✅ Daily notification job completed successfully');
  } catch (error) {
    console.error('❌ Error in daily notification job:', error);
  }
}, {
  scheduled: false // Don't start immediately
});

// Low stock alert job - runs every day at 9 AM
const lowStockAlertJob = cron.schedule('0 9 * * *', async () => {
  console.log('📦 Starting low stock alert job...');

  try {
    // Find products below their low stock threshold
    const lowStockProducts = await Product.find({
      stock: { $lte: 0 }
    }).limit(100);

    // Also include products where overall stock is below custom threshold
    const nearLowStockProducts = await Product.find({
      stock: { $gt: 0 },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    }).limit(200);

    const productsToAlert = [...lowStockProducts, ...nearLowStockProducts];

    console.log(`Found ${productsToAlert.length} products needing low stock alerts`);

    for (const product of productsToAlert) {
      try {
        if (!product.seller) continue;

        const seller = await User.findById(product.seller);
        if (!seller) continue;

        const message = product.stock <= 0
          ? `Your product "${product.name}" is out of stock. Consider restocking soon.`
          : `Your product "${product.name}" is running low on stock (${product.stock} units left).`;

        await Notification.create({
          user: seller._id,
          type: 'product',
          title: 'Low Stock Alert',
          message,
          data: {
            productId: product._id,
            stock: product.stock,
            lowStockThreshold: product.lowStockThreshold
          },
          sentVia: ['in_app']
        });

        console.log(`✅ Low stock notification created for seller ${seller.email} - product ${product.name}`);
      } catch (error) {
        console.error('❌ Failed to create low stock notification:', error);
      }
    }

    console.log('✅ Low stock alert job completed successfully');
  } catch (error) {
    console.error('❌ Error in low stock alert job:', error);
  }
}, {
  scheduled: false // Start from server-startup
});

// Send cart reminder emails
const sendCartReminders = async () => {
  try {
    // Find users with items in cart and haven't received notification in last 24 hours
    const usersWithCart = await User.find({
      'cart.items.0': { $exists: true },
      'cart.total': { $gt: 0 },
      $or: [
        { lastNotificationSent: null },
        { lastNotificationSent: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ],
      'preferences.notifications.email': true
    }).populate('cart.items.product');

    console.log(`Found ${usersWithCart.length} users with cart items to notify`);

    for (const user of usersWithCart) {
      try {
        const cartItems = user.cart.items.map(item => ({
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        }));

        await sendCartReminderEmail(user.email, user.name, cartItems);
        
        // Update last notification sent
        user.lastNotificationSent = new Date();
        await user.save();

        // Create notification record
        await Notification.create({
          user: user._id,
          type: 'promotion',
          title: 'Cart Reminder',
          message: `You have ${user.cart.items.length} items in your cart. Complete your purchase before they sell out!`,
          data: {
            cartItems: cartItems,
            cartTotal: user.cart.total
          },
          sentVia: ['email']
        });

        console.log(`✅ Cart reminder sent to ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to send cart reminder to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendCartReminders:', error);
  }
};

// Send product suggestions based on browsing history
const sendProductSuggestions = async () => {
  try {
    // Find users who haven't received suggestions in last 3 days
    const usersForSuggestions = await User.find({
      $or: [
        { lastNotificationSent: null },
        { lastNotificationSent: { $lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } }
      ],
      'preferences.notifications.email': true
    });

    console.log(`Found ${usersForSuggestions.length} users for product suggestions`);

    for (const user of usersForSuggestions) {
      try {
        // Get random products as suggestions (in real app, this would be based on browsing history)
        const suggestedProducts = await Product.aggregate([
          { $match: { isActive: true, stock: { $gt: 0 } } },
          { $sample: { size: 3 } },
          {
            $project: {
              name: 1,
              price: 1,
              description: { $substr: ['$description', 0, 100] },
              image: 1
            }
          }
        ]);

        if (suggestedProducts.length > 0) {
          await sendProductSuggestionsEmail(user.email, user.name, suggestedProducts);
          
          // Create notification record
          await Notification.create({
            user: user._id,
            type: 'promotion',
            title: 'New Products You Might Love',
            message: `Check out these ${suggestedProducts.length} products we think you'll love!`,
            data: {
              suggestedProducts
            },
            sentVia: ['email']
          });

          console.log(`✅ Product suggestions sent to ${user.email}`);
        }
      } catch (error) {
        console.error(`❌ Failed to send product suggestions to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendProductSuggestions:', error);
  }
};

// Manual trigger for testing
const triggerDailyNotifications = async () => {
  console.log('🔄 Manually triggering daily notifications...');
  await sendCartReminders();
  await sendProductSuggestions();
  console.log('✅ Manual notification trigger completed');
};

module.exports = {
  dailyNotificationJob,
  sendCartReminders,
  sendProductSuggestions,
  triggerDailyNotifications,
  lowStockAlertJob
};
