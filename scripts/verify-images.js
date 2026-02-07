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

// Image Schema
const imageSchema = new mongoose.Schema({}, { strict: false });
const Image = mongoose.model('Image', imageSchema);

async function verifyImages() {
  try {
    console.log('\n🔍 Verifying first 3 dress images in database:\n');
    
    // Get first 3 dress images
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).limit(3).lean();
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      console.log(`\n--- Image ${i+1}: ${img.filename} ---`);
      console.log('ID:', img._id);
      console.log('Category:', img.category);
      console.log('Size:', (img.size / 1024).toFixed(1), 'KB');
      console.log('Created:', img.createdAt);
      
      // Save image to disk for verification
      const outputPath = path.join(__dirname, `verify-${img.filename}`);
      fs.writeFileSync(outputPath, img.data);
      console.log('💾 Saved to:', outputPath);
    }

    console.log('\n\n✅ Check the saved images in scripts/ folder to verify content');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

verifyImages();
