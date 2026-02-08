const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user.model');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to database...\n');

        const email = 'admin@evara.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log('✓ User found in database:');
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  Role:', user.role);
            console.log('  ID:', user._id);
            console.log('\n✓ toPublicProfile() output:');
            console.log(JSON.stringify(user.toPublicProfile(), null, 2));
        } else {
            console.log('✗ User NOT found:', email);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkUser();
