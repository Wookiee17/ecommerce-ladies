const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function testConnection() {
    try {
        console.log('Testing connection...');
        console.log('URI present:', !!process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connection Successful!');

        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const info = await admin.buildInfo();
        console.log('MongoDB Version:', info.version);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:', error);
        process.exit(1);
    }
}

testConnection();
