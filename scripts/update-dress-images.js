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
const imageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  data: Buffer,
  category: String,
  productId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isPrimary: Boolean,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

const imagesDir = path.join(__dirname, '..', 'frontend', 'src', 'evara_images');

async function updateDressImages() {
  try {
    console.log('🗑️  Deleting old dress images from database...');
    const deleteResult = await Image.deleteMany({ category: 'dress' });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old dress images`);

    console.log('\n📤 Uploading correct dress images...');
    
    const files = fs.readdirSync(imagesDir)
      .filter(f => f.startsWith('dress') && f.endsWith('.jpg'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
      });

    let uploaded = 0;
    for (const filename of files) {
      const filePath = path.join(imagesDir, filename);
      const fileData = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);

      const image = new Image({
        filename: filename,
        originalName: filename,
        mimeType: 'image/jpeg',
        size: fileStats.size,
        data: fileData,
        category: 'dress',
        isPrimary: false
      });

      await image.save();
      uploaded++;
      console.log(`  ✅ ${filename} (${(fileStats.size / 1024).toFixed(1)} KB)`);
    }

    console.log(`\n🎉 Done! Uploaded ${uploaded} correct dress images`);

    // Verify
    const count = await Image.countDocuments({ category: 'dress' });
    console.log(`📊 Total dress images in database: ${count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

updateDressImages();
