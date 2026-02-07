const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Product Schema
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

async function checkProducts() {
  try {
    console.log('\n📦 Checking first 3 dress products:\n');
    
    const products = await Product.find({ category: 'dress' }).limit(3).lean();
    
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      console.log(`\n--- Product ${i+1}: ${p.name} ---`);
      console.log('Category:', p.category);
      console.log('Images:');
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. URL: ${img.url}`);
          console.log(`     Alt: ${img.alt}`);
          console.log(`     IsPrimary: ${img.isPrimary}`);
        });
      } else {
        console.log('  No images found!');
      }
    }

    // Check all dress products count
    const totalDress = await Product.countDocuments({ category: 'dress' });
    console.log(`\n\n📊 Total dress products: ${totalDress}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkProducts();
