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

async function exportAndCheck() {
  try {
    console.log('\n📤 Exporting first 3 dress images to verify content...\n');
    
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).limit(3);
    
    if (images.length === 0) {
      console.log('❌ No dress images found');
      return;
    }
    
    const outputDir = path.join(__dirname, 'verify-export');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    for (const img of images) {
      const outputPath = path.join(outputDir, img.filename);
      // Convert Binary to Buffer
      const buffer = Buffer.from(img.data.buffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`✅ Exported: ${img.filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
    }
    
    console.log(`\n🎉 Exported to: ${outputDir}`);
    console.log('Please check these images - if they show SHOES, we need to replace them');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

exportAndCheck();
