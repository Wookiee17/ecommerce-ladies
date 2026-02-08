const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/user.model');

async function testModel() {
    try {
        console.log('Testing Model Query...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        console.log('Querying users...');
        const count = await User.countDocuments();
        console.log(`User Count: ${count}`);

        const seller = await User.findOne({ role: 'seller' });
        console.log('Found Seller:', seller ? seller.email : 'None');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Model Test Failed:', error);
        process.exit(1);
    }
}

testModel();
