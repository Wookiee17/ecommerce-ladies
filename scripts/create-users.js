const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
    sellerInfo: {
        businessName: String,
        isEmpty: { type: Boolean, default: false } // Placeholder to allow allowing loose object
    },
    isEmailVerified: { type: Boolean, default: true }
}, { strict: false }); // Strict false to allow other fields without defining full schema

const User = mongoose.model('User', userSchema);

async function createUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create Admin
        const adminEmail = 'admin@evara.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                isEmailVerified: true
            });
            console.log('✅ Created Admin User: admin@evara.com / admin123');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

        // 2. Create Seller
        const sellerEmail = 'seller@evara.com';
        const sellerExists = await User.findOne({ email: sellerEmail });

        if (!sellerExists) {
            const hashedPassword = await bcrypt.hash('seller123', 10);
            await User.create({
                name: 'Demo Seller',
                email: sellerEmail,
                password: hashedPassword,
                role: 'seller',
                isEmailVerified: true,
                sellerInfo: {
                    businessName: 'Evara Direct',
                    businessEmail: 'seller@evara.com',
                    businessPhone: '9876543210',
                    isVerified: true,
                    verificationStatus: 'approved'
                }
            });
            console.log('✅ Created Seller User: seller@evara.com / seller123');
        } else {
            console.log('ℹ️ Seller user already exists');
        }

        process.exit();
    } catch (error) {
        console.error('❌ Error creating users:', error);
        process.exit(1);
    }
}

createUsers();
