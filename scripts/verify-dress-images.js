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

const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }));

async function exportImages() {
  try {
    console.log('\n📤 Exporting first 5 dress images to verify content...\n');
    
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).limit(5);
    
    if (images.length === 0) {
      console.log('❌ No dress images found in database');
      return;
    }
    
    const outputDir = path.join(__dirname, 'verify-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    for (const img of images) {
      const outputPath = path.join(outputDir, img.filename);
      fs.writeFileSync(outputPath, img.data);
      console.log(`✅ Exported: ${img.filename} (${(img.size / 1024).toFixed(1)} KB)`);
    }
    
    console.log(`\n🎉 Exported ${images.length} images to scripts/verify-images/`);
    console.log('Please check these images - if they show SHOES, we need to replace them with actual dress images.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

exportImages();
