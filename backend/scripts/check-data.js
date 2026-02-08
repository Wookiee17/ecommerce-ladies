const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('../src/models/order.model');
const Product = require('../src/models/product.model');
const User = require('../src/models/user.model');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database...\n');

        // Check orders
        const orderCount = await Order.countDocuments();
        const completedOrders = await Order.countDocuments({ 'payment.status': 'completed' });

        // Calculate revenue
        const revenueResult = await Order.aggregate([
            { $match: { 'payment.status': 'completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$payment.amount' }
                }
            }
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Check products
        const productCount = await Product.countDocuments({ isActive: true });

        // Check users
        const userCount = await User.countDocuments();

        console.log('=== DATABASE STATS ===');
        console.log('Total Orders:', orderCount);
        console.log('Completed Orders:', completedOrders);
        console.log('Total Revenue: ₹', totalRevenue);
        console.log('Total Products:', productCount);
        console.log('Total Users:', userCount);

        // Show sample orders
        const sampleOrders = await Order.find().limit(3);
        console.log('\n=== SAMPLE ORDERS ===');
        sampleOrders.forEach(order => {
            console.log(`Order ${order.orderNumber}:`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Payment Status: ${order.payment.status}`);
            console.log(`  Amount: ₹${order.payment.amount}`);
            console.log(`  Items: ${order.items.length}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkData();
