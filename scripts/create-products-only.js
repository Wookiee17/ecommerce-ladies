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

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }));

const baseDir = path.join(__dirname, '..', 'frontend', 'src', 'Kimi_Agent_Evara 450图集');
const productsFile = path.join(baseDir, 'products.json');

async function createProducts() {
  console.log('\n🏪 CREATING PRODUCTS\n');
  
  // Load products data
  const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
  const products = productsData.products;
  
  console.log(`Found ${products.length} products in JSON\n`);
  
  // Get all images from DB
  const images = await Image.find({}).lean();
  const imageMap = {};
  images.forEach(img => {
    imageMap[img.filename] = img._id.toString();
  });
  
  console.log(`Found ${images.length} images in database\n`);
  
  // Create seller manually (without User model)
  const sellerId = new mongoose.Types.ObjectId();
  
  let created = 0;
  const productsToInsert = [];
  
  for (const p of products) {
    // Map image filenames to database URLs
    const productImages = p.images
      .filter(img => imageMap[img])
      .map((img, idx) => ({
        url: `/api/images/${imageMap[img]}`,
        alt: `${p.category} view`,
        isPrimary: idx === 0
      }));
    
    if (productImages.length === 0) {
      console.log(`  ⚠️  Skipping: ${p.name} (no images found)`);
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
    console.log('🚀 CREATING PRODUCTS FROM JSON\n');
    
    const count = await createProducts();
    
    const finalProducts = await Product.countDocuments();
    
    console.log('\n✨ COMPLETE!');
    console.log('═══════════════════════════════');
    console.log(`   Total Products: ${finalProducts}`);
    console.log('═══════════════════════════════');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

main();
