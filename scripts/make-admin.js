const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/user.model');

async function makeAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database...');

        const email = 'admin@evara.com';

        const user = await User.findOneAndUpdate(
            { email },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`✓ SUCCESS: ${email} is now an admin!`);
            console.log(`User details:`, {
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            console.error(`✗ ERROR: User not found with email: ${email}`);
            console.log('Creating new admin user...');

            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 10);

            const newAdmin = await User.create({
                name: 'Admin User',
                email: 'admin@evara.com',
                password: hashedPassword,
                role: 'admin',
                isEmailVerified: true
            });

            console.log(`✓ Created new admin user: ${newAdmin.email}`);
            console.log('Password: admin123');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

makeAdmin();
