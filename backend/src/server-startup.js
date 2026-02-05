const { dailyNotificationJob, lowStockAlertJob } = require('./jobs/notificationJob');

// Start the daily notification job
dailyNotificationJob.start();
lowStockAlertJob.start();

console.log('📅 Daily notification job scheduled to run at 10:00 AM daily');
console.log('📦 Low stock alert job scheduled to run at 9:00 AM daily');
