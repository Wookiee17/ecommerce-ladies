const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Schemas
const productSchema = new mongoose.Schema({}, { strict: false });
const imageSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);
const Image = mongoose.model('Image', imageSchema);

async function fixProductImages() {
  try {
    console.log('\n🔄 Fixing dress product images...\n');
    
    // Get all dress products
    const products = await Product.find({ category: 'dress' }).lean();
    console.log(`Found ${products.length} dress products`);
    
    let updated = 0;
    
    for (const product of products) {
      if (!product.images || product.images.length === 0) continue;
      
      const primaryImage = product.images[0];
      const imageId = primaryImage.url.replace('/api/images/', '');
      
      // Find the image in database
      const image = await Image.findById(imageId).lean();
      
      if (image && image.externalUrl) {
        // Update product to use external URL
        await Product.updateOne(
          { _id: product._id },
          { 
            $set: { 
              'images.0.url': image.externalUrl
            }
          }
        );
        updated++;
        if (updated % 10 === 0) {
          console.log(`  ✅ Updated ${updated}/${products.length} products`);
        }
      }
    }
    
    console.log(`\n🎉 Done! Updated ${updated} products`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

fixProductImages();
