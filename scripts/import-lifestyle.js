const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const Product = require('../backend/src/models/product.model');
const User = require('../backend/src/models/user.model');

// Path to the new data file (User will provide this)
// For now, checks for 'lifestyle_products.json' in the same folder or root
const dataPath = path.join(__dirname, '../frontend/Kimi_Agent_Vélure Electric Beauty/velure_products.json');

async function importLifestyleProducts() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected');

        // 1. Get or Create Seller
        let seller = await User.findOne({ role: 'seller', email: 'lifestyle_seller@evara.com' });

        const sellerData = {
            name: 'Vélure',
            email: 'lifestyle_seller@evara.com',
            password: 'password123',
            role: 'seller',
            sellerInfo: { businessName: 'Vélure Electric Beauty' }
        };

        if (!seller) {
            console.log('ℹ️ Creating Seller: Vélure...');
            seller = await User.create(sellerData);
        } else {
            console.log('ℹ️ Updating Seller to Vélure...');
            seller.name = sellerData.name;
            seller.sellerInfo = sellerData.sellerInfo;
            await seller.save();
        }
        console.log(`✅ Using Seller: ${seller.name} (${seller._id})`);

        // 2. Read Data
        if (!fs.existsSync(dataPath)) {
            console.error(`❌ Data file not found at: ${dataPath}`);
            console.error('Please place your "lifestyle_products.json" file in the root folder.');
            process.exit(1);
        }

        const rawData = fs.readFileSync(dataPath, 'utf-8');
        const products = JSON.parse(rawData);
        console.log(`ℹ️ Found ${products.length} products to import.`);

        // 3. Transform and Insert
        const productsToImport = products.map(p => {
            // Fix image URLs
            const fixedImages = p.images.map(img => {
                let url = img.url;
                if (url.startsWith('/velure_images/')) {
                    url = '/uploads' + url;
                }
                return { ...img, url };
            });

            return {
                ...p,
                images: fixedImages,
                category: 'lifestyle electronics', // Ensure category is correct
                seller: seller._id,
                isActive: true,
                isNew: true,
                stock: p.stock || 50,
                rating: p.rating || 4.5,
                reviewCount: p.reviewCount || 10
            };
        });

        // Optional: Clear existing lifestyle items
        await Product.deleteMany({ category: 'lifestyle electronics' });
        console.log('🗑️ Cleared existing lifestyle electronics products.');

        await Product.insertMany(productsToImport);
        console.log(`✅ Successfully imported ${productsToImport.length} lifestyle electronics products!`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

importLifestyleProducts();
