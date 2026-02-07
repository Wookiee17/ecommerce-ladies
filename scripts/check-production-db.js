const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to PRODUCTION MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }), 'images');
const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

async function checkProductionData() {
  try {
    console.log('\n🔍 Checking PRODUCTION database...\n');
    
    // Count images
    const imageCount = await Image.countDocuments();
    console.log(`📸 Total Images: ${imageCount}`);
    
    // Count products
    const productCount = await Product.countDocuments();
    console.log(`📦 Total Products: ${productCount}`);
    
    // Check first few images
    const images = await Image.find({}).limit(3).lean();
    console.log('\n--- Sample Images ---');
    images.forEach(img => {
      console.log(`  ID: ${img._id}`);
      console.log(`  Filename: ${img.filename}`);
      console.log(`  Has data: ${!!img.data}`);
      console.log(`  Data length: ${img.data ? img.data.length : 0}`);
      console.log('');
    });
    
    // Check first few products
    const products = await Product.find({}).limit(3).lean();
    console.log('\n--- Sample Products ---');
    products.forEach(p => {
      console.log(`\n  Name: ${p.name}`);
      console.log(`  Images: ${p.images ? p.images.length : 0}`);
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          console.log(`    [${i}] ${img.url}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
  }
}

checkProductionData();
