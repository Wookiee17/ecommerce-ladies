const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const products = require('../evara-complete/products_export.json');
const Product = require('../backend/src/models/product.model');
const User = require('../backend/src/models/user.model');

async function importData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Get a Seller ID (Required by Schema)
        let seller = await User.findOne({ role: 'seller' });
        if (!seller) {
            // Create a dummy seller if none exists
            console.log('ℹ️ No seller found, creating one...');
            seller = await User.create({
                name: 'System Import Seller',
                email: 'seller_import@evara.com',
                password: 'password123',
                role: 'seller',
                sellerInfo: { businessName: 'Evara Imports' }
            });
        }
        console.log(`ℹ️ Assigning products to seller: ${seller._id}`);

        // 2. Clear existing products
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing products');

        // 3. Transform and Import Data
        const productsToImport = products.map(p => ({
            name: p.name,
            description: p.description,
            shortDescription: p.description.substring(0, 150) + '...',
            price: p.price,
            originalPrice: p.originalPrice,
            category: p.category,
            subcategory: p.subcategory,

            // Map 'image' string to 'images' array
            images: [{
                url: p.image,
                alt: p.name,
                isPrimary: true
            }],

            // Map flat arrays to variants object
            variants: {
                colors: p.colors ? p.colors.map(c => ({ name: c })) : [],
                sizes: p.sizes ? p.sizes.map(s => ({ name: s, inStock: true })) : []
            },

            // Map 'reviews' number to 'reviewCount'
            rating: p.rating,
            reviewCount: p.reviews,

            // Flags
            isActive: true, // Ensure it's active!
            inStock: p.inStock,
            isNew: p.isNew,
            isBestseller: p.isBestseller,

            // Required Seller
            seller: seller._id,

            stock: 100 // Default stock
        }));

        await Product.insertMany(productsToImport);
        console.log(`✅ Successfully imported ${productsToImport.length} products`);

        process.exit();
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
}

importData();
