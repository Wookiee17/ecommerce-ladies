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

async function checkProductImages() {
  try {
    console.log('\n🔍 Checking first 3 products and their image URLs...\n');
    
    const products = await Product.find({}).limit(3).lean();
    
    for (const p of products) {
      console.log(`\n--- ${p.name} ---`);
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          console.log(`  Image ${i + 1}: ${img.url}`);
          console.log(`    isPrimary: ${img.isPrimary}`);
        });
      } else {
        console.log('  ❌ No images array');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkProductImages();
