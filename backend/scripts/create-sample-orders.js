const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user.model');
const Product = require('../src/models/product.model');
const Order = require('../src/models/order.model');

async function createSampleOrders() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database...\n');

        // Get admin user
        const admin = await User.findOne({ email: 'admin@evara.com' });
        if (!admin) {
            console.error('Admin user not found');
            process.exit(1);
        }

        // Get some random products
        const products = await Product.find({ isActive: true }).limit(10);
        if (products.length === 0) {
            console.error('No products found. Run product seed first.');
            process.exit(1);
        }

        console.log(`Creating sample orders for ${admin.email}...\n`);

        // Create 15 sample orders with different statuses and dates
        const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
        const paymentStatuses = ['pending', 'completed', 'completed', 'completed', 'completed']; // Most completed

        const orders = [];

        for (let i = 0; i < 15; i++) {
            const daysAgo = Math.floor(Math.random() * 30); // Random date in last 30 days
            const createdAt = new Date();
            createdAt.setDate(createdAt.getDate() - daysAgo);

            const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
            const items = [];
            let subtotal = 0;

            for (let j = 0; j < numItems; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 2) + 1;
                const itemTotal = product.price * quantity;
                subtotal += itemTotal;

                items.push({
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    quantity,
                    size: 'M',
                    color: product.variants?.colors?.[0]?.name || 'Default',
                    image: product.images?.[0]?.url || '',
                    seller: product.seller
                });
            }

            const shipping = subtotal >= 999 ? 0 : 99;
            const total = subtotal + shipping;

            const statusIndex = Math.floor(Math.random() * statuses.length);

            orders.push({
                user: admin._id,
                orderNumber: `ORD-${Date.now()}-${i}`,
                items,
                shippingAddress: {
                    name: admin.name,
                    phone: admin.phone || '1234567890',
                    address: '123 Main Street',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001',
                    landmark: 'Near Station'
                },
                payment: {
                    method: 'razorpay',
                    amount: total,
                    subtotal,
                    discount: 0,
                    shippingCost: shipping,
                    tax: 0,
                    currency: 'INR',
                    status: paymentStatuses[statusIndex],
                    paidAt: paymentStatuses[statusIndex] === 'completed' ? createdAt : null
                },
                status: statuses[statusIndex],
                createdAt,
                updatedAt: createdAt
            });
        }

        await Order.insertMany(orders);

        console.log(`✓ Created ${orders.length} sample orders`);
        console.log(`✓ Total revenue from completed orders: ₹${orders
            .filter(o => o.payment.status === 'completed')
            .reduce((sum, o) => sum + o.payment.amount, 0)
            }`);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

createSampleOrders();
