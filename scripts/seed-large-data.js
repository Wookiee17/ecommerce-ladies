const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const productsRaw = require('../evara-complete/products_export.json');
const Product = require('../backend/src/models/product.model');
const User = require('../backend/src/models/user.model');

const CATEGORIES = ['dress', 'jewelry', 'beauty'];
const ADJECTIVES = ['Elegant', 'Modern', 'Classic', 'Vintage', 'Chic', 'Luxury', 'Minimalist', 'Bohemian', 'Urban', 'Sophisticated'];
const NOUNS = {
    'dress': ['Evening Gown', 'Summer Dress', 'Cocktail Dress', 'Maxi Dress', 'Sundress', 'Party Dress', 'Wrap Dress'],
    'jewelry': ['Necklace', 'Earrings', 'Bracelet', 'Ring', 'Pendant', 'Choker', 'Anklet'],
    'beauty': ['Lipstick', 'Serum', 'Moisturizer', 'Foundation', 'Perfume', 'Eye Shadow', 'Mascara']
};

// Helper: Get random item from array
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper: Get random number between min and max
const randomNum = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seedData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/evara';
        await mongoose.connect(mongoUri);
        console.log(`✅ Connected to MongoDB: ${mongoUri}`);

        // 1. Get Seller
        let seller = await User.findOne({ role: 'seller' });
        if (!seller) {
            console.log('ℹ️ No seller found, creating one...');
            seller = await User.create({
                name: 'System Import Seller',
                email: 'seller_import_large@evara.com',
                password: 'password123',
                role: 'seller',
                sellerInfo: { businessName: 'Evara Imports' }
            });
        }
        console.log(`ℹ️ Assigning products to seller: ${seller._id}`);

        // 2. Clear existing products (Optional: Comment out if you want to append)
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing products');

        // 3. Extract valid images per category from existing export to keep them realistic
        const imagesByCategory = {
            'dress': productsRaw.filter(p => p.category.toLowerCase() === 'dress').map(p => p.image).filter(Boolean),
            'jewelry': productsRaw.filter(p => p.category.toLowerCase() === 'jewelry').map(p => p.image).filter(Boolean),
            'beauty': productsRaw.filter(p => p.category.toLowerCase() === 'beauty').map(p => p.image).filter(Boolean)
        };

        const newProducts = [];

        // 4. Generate 50 products per category
        for (const category of CATEGORIES) {
            console.log(`Generating 50 products for category: ${category}...`);
            const categoryImages = imagesByCategory[category].length > 0 ? imagesByCategory[category] : ['https://via.placeholder.com/300'];

            for (let i = 0; i < 50; i++) {
                const adjective = random(ADJECTIVES);
                const noun = random(NOUNS[category]);
                const name = `${adjective} ${noun} ${randomNum(1, 999)}`;

                const product = {
                    name: name,
                    description: `This is a beautiful ${name.toLowerCase()}. Perfect for any occasion. Made with high-quality materials.`,
                    shortDescription: `A ${adjective.toLowerCase()} ${noun.toLowerCase()} for you.`,
                    price: randomNum(500, 15000),
                    originalPrice: randomNum(16000, 25000),
                    category: category,
                    subcategory: category === 'dress' ? (i % 2 === 0 ? 'casual' : 'formal') : 'general',

                    images: [{
                        url: random(categoryImages),
                        alt: name,
                        isPrimary: true
                    }],

                    variants: {
                        colors: [{ name: random(['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver']) }],
                        sizes: [{ name: random(['S', 'M', 'L', 'XL']) }]
                    },

                    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
                    reviewCount: randomNum(0, 500),

                    isActive: true,
                    inStock: true,
                    stock: randomNum(10, 100),
                    isNew: Math.random() > 0.8,
                    isBestseller: Math.random() > 0.8,
                    seller: seller._id
                };
                newProducts.push(product);
            }
        }

        // 5. Insert
        await Product.insertMany(newProducts);
        console.log(`✅ Successfully inserted ${newProducts.length} new products!`);

        process.exit();
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedData();
