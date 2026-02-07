const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const Image = mongoose.model('Image', new mongoose.Schema({
  filename: String, mimeType: String, size: Number, data: Buffer, category: String, isPrimary: Boolean
}, { timestamps: true }));

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

const imagesDir = path.join(__dirname, '..', 'frontend', 'src', 'Kimi_Agent_Evara', 'evara_images');
const productsFile = path.join(__dirname, '..', 'frontend', 'src', 'Kimi_Agent_Evara', 'products.json');

async function uploadAndCreate() {
  try {
    console.log('🚀 STARTING FRESH UPLOAD\n');
    
    // Clear existing
    console.log('🗑️  Clearing database...');
    await Product.deleteMany({});
    await Image.deleteMany({});
    console.log('✅ Database cleared\n');
    
    // Get all image files
    const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.jpg') && !f.startsWith('category-') && !f.startsWith('hero-') && !f.startsWith('featured-') && !f.startsWith('promo-')).sort();
    console.log(`📁 Found ${files.length} product images\n`);
    
    // Upload images
    console.log('📤 Uploading images to MongoDB...\n');
    const imageMap = {};
    let uploaded = 0;
    
    for (const filename of files) {
      const category = filename.split('-')[0];
      const filePath = path.join(imagesDir, filename);
      const data = fs.readFileSync(filePath);
      
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
        console.log(`  ✅ Uploaded ${uploaded}/${files.length}`);
      }
    }
    
    console.log(`\n🎉 Uploaded ${uploaded} images\n`);
    
    // Load products JSON
    const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
    const products = productsData.products;
    console.log(`📋 Found ${products.length} products in JSON\n`);
    
    // Create seller
    const sellerId = new mongoose.Types.ObjectId();
    
    // Create products
    console.log('🏪 Creating products...\n');
    const productsToInsert = [];
    let created = 0;
    
    for (const p of products) {
      const productImages = p.images
        .filter(img => imageMap[img])
        .map((img, idx) => ({
          url: `/api/images/${imageMap[img]}`,
          alt: `${p.category} view`,
          isPrimary: idx === 0
        }));
      
      if (productImages.length === 0) {
        console.log(`  ⚠️  Skipping: ${p.name} (no images)`);
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
        seller: sellerId
      };
      
      productsToInsert.push(product);
      created++;
      
      if (created % 10 === 0) {
        console.log(`  📦 Prepared ${created}/${products.length}`);
      }
    }
    
    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
    }
    
    console.log(`\n✅ Created ${created} products\n`);
    
    // Summary
    const finalImages = await Image.countDocuments();
    const finalProducts = await Product.countDocuments();
    
    console.log('✨ COMPLETE!');
    console.log('═══════════════════════════════');
    console.log(`   Images: ${finalImages}`);
    console.log(`   Products: ${finalProducts}`);
    console.log('═══════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

uploadAndCreate();
