const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const products = require('../evara-complete/products_export.json');

const productSchema = new mongoose.Schema({
    id: String,
    name: String,
    description: String,
    price: Number,
    originalPrice: Number,
    image: String,
    category: String,
    subcategory: String,
    rating: Number,
    reviews: Number,
    inStock: Boolean,
    isNew: Boolean,
    isBestseller: Boolean,
    colors: [String],
    sizes: [String]
});

const Product = mongoose.model('Product', productSchema);

async function importData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/evara');
        console.log('Connected to MongoDB');

        await Product.deleteMany({});
        console.log('Cleared existing products');

        await Product.insertMany(products);
        console.log(`Imported ${products.length} products`);

        process.exit();
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
}

importData();
