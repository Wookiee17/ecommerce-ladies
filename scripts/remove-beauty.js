const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const Product = require('../backend/src/models/product.model');

async function removeBeautyProducts() {
    try {
        console.log('🔌 Connecting...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🗑️ Removing products in category: beauty');
        const result = await Product.deleteMany({ category: 'beauty' });

        console.log(`✅ Removed ${result.deletedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

removeBeautyProducts();
