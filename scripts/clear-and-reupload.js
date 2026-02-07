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

async function clearAndReupload() {
  try {
    console.log('\n🗑️  STEP 1: Clearing ALL images from database...');
    const deleteResult = await Image.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} images\n`);

    console.log('📤 STEP 2: Re-uploading correct images from evara_images...\n');
    
    // Get all files from evara_images
    const files = fs.readdirSync(imagesDir)
      .filter(f => f.endsWith('.jpg'))
      .sort((a, b) => {
        // Extract number from filename for proper sorting
        const numA = parseInt(a.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });

    let uploaded = 0;
    const categories = { dress: 0, jewelry: 0, beauty: 0 };
    
    for (const filename of files) {
      // Determine category from filename
      let category = 'product';
      if (filename.startsWith('dress')) category = 'dress';
      else if (filename.startsWith('jewelry')) category = 'jewelry';
      else if (filename.startsWith('beauty')) category = 'beauty';
      
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
      categories[category]++;
      uploaded++;
      
      if (uploaded % 50 === 0 || uploaded === files.length) {
        console.log(`  ✅ Uploaded ${uploaded}/${files.length} images (${categories.dress} dress, ${categories.jewelry} jewelry, ${categories.beauty} beauty)`);
      }
    }

    console.log(`\n🎉 STEP 2 Complete!`);
    console.log(`   Dress: ${categories.dress} images`);
    console.log(`   Jewelry: ${categories.jewelry} images`);
    console.log(`   Beauty: ${categories.beauty} images`);
    console.log(`   Total: ${uploaded} images\n`);

    // Verify counts
    const verifyCounts = await Image.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('📊 Verification:');
    verifyCounts.forEach(c => console.log(`   ${c._id}: ${c.count}`));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

clearAndReupload();
