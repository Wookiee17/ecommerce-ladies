const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
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

const categories = ['dress', 'jewelry', 'beauty'];
const imagesDir = path.join(__dirname, '..', 'frontend', 'public', 'evara_images');

async function migrateImages() {
  try {
    let totalImages = 0;
    let skippedImages = 0;

    for (const category of categories) {
      console.log(`\n📁 Processing ${category} images...`);
      
      const files = fs.readdirSync(imagesDir)
        .filter(f => f.startsWith(category) && f.endsWith('.jpg'))
        .sort((a, b) => {
          const numA = parseInt(a.replace(`${category}-`, '').replace('.jpg', ''));
          const numB = parseInt(b.replace(`${category}-`, '').replace('.jpg', ''));
          return numA - numB;
        });

      for (const filename of files) {
        const filePath = path.join(imagesDir, filename);
        const fileData = fs.readFileSync(filePath);
        const fileStats = fs.statSync(filePath);

        // Check if image already exists
        const existing = await Image.findOne({ filename, category });
        if (existing) {
          console.log(`  ⏭️  Skipped: ${filename} (already exists)`);
          skippedImages++;
          continue;
        }

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
        totalImages++;
        console.log(`  ✅ Uploaded: ${filename} (${(fileStats.size / 1024).toFixed(1)} KB)`);
      }
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Total uploaded: ${totalImages}`);
    console.log(`   Skipped: ${skippedImages}`);

    // Show summary
    const summary = await Image.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalSize: { $sum: '$size' } } }
    ]);

    console.log('\n📊 Database Summary:');
    for (const s of summary) {
      console.log(`   ${s._id}: ${s.count} images (${(s.totalSize / 1024 / 1024).toFixed(2)} MB)`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

migrateImages();
