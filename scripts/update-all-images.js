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

async function updateCategoryImages(category) {
  try {
    console.log(`\n🗑️  Deleting old ${category} images from database...`);
    const deleteResult = await Image.deleteMany({ category: category });
    console.log(`✅ Deleted ${deleteResult.deletedCount} old ${category} images`);

    console.log(`\n📤 Uploading correct ${category} images...`);
    
    const files = fs.readdirSync(imagesDir)
      .filter(f => f.startsWith(category) && f.endsWith('.jpg'))
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
        category: category,
        isPrimary: false
      });

      await image.save();
      uploaded++;
      if (uploaded % 25 === 0 || uploaded === files.length) {
        console.log(`  ✅ ${filename} (${uploaded}/${files.length})`);
      }
    }

    console.log(`🎉 Done! Uploaded ${uploaded} correct ${category} images`);

  } catch (error) {
    console.error(`❌ Error updating ${category}:`, error);
  }
}

async function main() {
  // Update jewelry and beauty
  await updateCategoryImages('jewelry');
  await updateCategoryImages('beauty');

  // Verify
  console.log('\n📊 Final counts:');
  for (const cat of ['dress', 'jewelry', 'beauty']) {
    const count = await Image.countDocuments({ category: cat });
    console.log(`  ${cat}: ${count} images`);
  }

  await mongoose.connection.close();
  console.log('\n🔒 Database connection closed');
}

main();
