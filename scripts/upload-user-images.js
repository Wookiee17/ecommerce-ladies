const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Schemas
const imageSchema = new mongoose.Schema({
  filename: String,
  mimeType: String,
  size: Number,
  data: Buffer,
  category: String,
  isPrimary: Boolean
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

// Paths
const baseDir = path.join(__dirname, '..', 'frontend', 'src', 'Kimi_Agent_Evara 450图集');
const imagesDir = path.join(baseDir, 'evara_images');
const productsFile = path.join(baseDir, 'products.json');

async function uploadImages() {
  console.log('\n📤 UPLOADING IMAGES TO MONGODB\n');
  
  // Get all image files
  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg')).sort();
  console.log(`Found ${files.length} images to upload\n`);
  
  let uploaded = 0;
  const imageMap = {}; // filename -> _id mapping
  
  for (const filename of files) {
    const category = filename.split('-')[0];
    const filePath = path.join(imagesDir, filename);
    const data = fs.readFileSync(filePath);
    
    try {
      const image = new Image({
        filename: filename,
        mimeType: 'image/jpeg',
        size: data.length,
        data: data,
        category: category,
        isPrimary: false
      });
      
      await image.save();
      imageMap[filename] = image._id.toString();
      uploaded++;
      
      if (uploaded % 25 === 0 || uploaded === files.length) {
        console.log(`  ✅ Uploaded ${uploaded}/${files.length} images`);
      }
    } catch (err) {
      console.log(`  ❌ Failed: ${filename} - ${err.message}`);
    }
  }
  
  console.log(`\n🎉 Uploaded ${uploaded} images successfully`);
  return imageMap;
}

async function createProducts(imageMap) {
  console.log('\n🏪 CREATING PRODUCTS\n');
  
  // Load products data
  const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  const products = productsData.products;
  
  console.log(`Found ${products.length} products in JSON\n`);
  
  // Get or create seller
  const User = require('../backend/src/models/user.model');
  const bcrypt = require('bcryptjs');
  
  let seller = await User.findOne({ role: 'seller' });
  if (!seller) {
    const hashedPassword = await bcrypt.hash('seller123', 10);
    seller = await User.create({
      name: 'Evara Store',
      email: 'store@evara.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      sellerInfo: { businessName: 'Evara Fashion Store' }
    });
    console.log('✅ Created seller account\n');
  }
  
  let created = 0;
  const productsToInsert = [];
  
  for (const p of products) {
    // Map image filenames to database URLs
    const productImages = p.images
      .filter(img => imageMap[img]) // Only include images that exist
      .map((img, idx) => ({
        url: `/api/images/${imageMap[img]}`,
        alt: `${p.category} view`,
        isPrimary: idx === 0
      }));
    
    if (productImages.length === 0) {
      console.log(`  ⚠️  No images for: ${p.name}`);
      continue;
    }
    
    const product = {
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription || p.description.substring(0, 100),
      price: p.price,
      originalPrice: p.originalPrice,
      category: p.category,
      subcategory: p.subcategory || 'general',
      images: productImages,
      variants: {
        colors: p.colors.map(c => ({ name: c })),
        sizes: p.sizes.map(s => ({ name: s, inStock: true }))
      },
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500),
      isActive: true,
      inStock: true,
      stock: Math.floor(Math.random() * 90) + 10,
      isNew: Math.random() > 0.8,
      isBestseller: Math.random() > 0.8,
      seller: seller._id
    };
    
    productsToInsert.push(product);
    created++;
    
    if (created % 10 === 0) {
      console.log(`  📦 Prepared ${created}/${products.length} products`);
    }
  }
  
  // Insert all products
  if (productsToInsert.length > 0) {
    await Product.insertMany(productsToInsert);
  }
  
  console.log(`\n✅ Created ${created} products successfully`);
  return created;
}

async function main() {
  try {
    console.log('🚀 STARTING UPLOAD PROCESS\n');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await Image.deleteMany({});
    console.log('✅ Database cleared\n');
    
    // Upload images
    const imageMap = await uploadImages();
    
    // Create products
    const productCount = await createProducts(imageMap);
    
    // Final verification
    const finalImages = await Image.countDocuments();
    const finalProducts = await Product.countDocuments();
    
    console.log('\n✨ COMPLETE!');
    console.log('═══════════════════════════════');
    console.log(`   Images in DB: ${finalImages}`);
    console.log(`   Products: ${finalProducts}`);
    console.log('═══════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

main();
