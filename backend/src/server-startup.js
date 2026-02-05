const { dailyNotificationJob } = require('./jobs/notificationJob');

// Start the daily notification job
dailyNotificationJob.start();

console.log('📅 Daily notification job scheduled to run at 10:00 AM daily');
