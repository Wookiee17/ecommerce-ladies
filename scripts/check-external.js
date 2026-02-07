const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Image Schema
const imageSchema = new mongoose.Schema({}, { strict: false });
const Image = mongoose.model('Image', imageSchema);

async function checkImages() {
  try {
    console.log('\n🔍 Checking dress images for externalUrl:\n');
    
    const images = await Image.find({ category: 'dress' }).limit(5).lean();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      console.log(`\n--- ${img.filename} ---`);
      console.log('ID:', img._id);
      console.log('External URL:', img.externalUrl || 'NOT SET');
      console.log('Has data:', img.data ? 'YES' : 'NO');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

checkImages();
