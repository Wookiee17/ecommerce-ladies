const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

async function checkImageUrls() {
  try {
    console.log('\n🔍 Checking all products for Unsplash URLs...\n');
    
    const products = await Product.find({}).lean();
    let count = 0;
    
    for (const p of products) {
      if (p.images && p.images.length > 0) {
        p.images.forEach(img => {
          if (img.url && img.url.includes('unsplash.com')) {
            console.log(`❌ ${p.name}: ${img.url}`);
            count++;
          }
        });
      }
    }
    
    if (count === 0) {
      console.log('✅ No Unsplash URLs found in products');
    } else {
      console.log(`\n❌ Found ${count} images with Unsplash URLs`);
      console.log('\nThese need to be replaced with /api/images/ IDs');
    }
    
    // Check first few products to see their image structure
    console.log('\n📋 First 3 product images:');
    products.slice(0, 3).forEach(p => {
      console.log(`\n${p.name}:`);
      p.images?.slice(0, 2).forEach(img => console.log(`  - ${img.url}`));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkImageUrls();
