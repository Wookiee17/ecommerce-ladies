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
const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }));

async function debugProducts() {
  try {
    console.log('\n🔍 Debugging dress products...\n');
    
    // Get first 3 dress products
    const products = await Product.find({ category: 'dress' }).limit(3).lean();
    
    console.log(`Found ${products.length} dress products\n`);
    
    for (const p of products) {
      console.log(`--- Product: ${p.name} ---`);
      console.log(`Images count: ${p.images?.length || 0}`);
      
      if (p.images && p.images.length > 0) {
        p.images.forEach((img, i) => {
          console.log(`  Image ${i + 1}: ${img.url}`);
          console.log(`    Alt: ${img.alt}, Primary: ${img.isPrimary}`);
        });
        
        // Check if image exists in database
        const imgId = p.images[0].url.replace('/api/images/', '');
        const imageExists = await Image.findById(imgId);
        console.log(`    Image in DB: ${imageExists ? '✅ Yes' : '❌ No'}`);
        if (imageExists) {
          console.log(`    Filename: ${imageExists.filename}`);
        }
      }
      console.log('');
    }
    
    // Summary
    const totalProducts = await Product.countDocuments();
    const totalImages = await Image.countDocuments();
    console.log('📊 Summary:');
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Images: ${totalImages}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

debugProducts();
