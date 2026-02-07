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

async function deleteAll() {
  try {
    console.log('\n🗑️  DELETING ALL DATA...\n');
    
    // Delete all products
    const productsDeleted = await Product.deleteMany({});
    console.log(`✅ Deleted ${productsDeleted.deletedCount} products`);
    
    // Delete all images
    const imagesDeleted = await Image.deleteMany({});
    console.log(`✅ Deleted ${imagesDeleted.deletedCount} images`);
    
    console.log('\n🎉 Database cleaned!');
    console.log('   Products: 0');
    console.log('   Images: 0');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

deleteAll();
