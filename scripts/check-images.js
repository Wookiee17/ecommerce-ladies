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
const imageSchema = new mongoose.Schema({
  filename: String,
  category: String,
  data: Buffer,
  size: Number
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

async function checkImages() {
  try {
    // Count images by category
    const counts = await Image.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('\n📊 Image counts by category:');
    counts.forEach(c => console.log(`  ${c._id}: ${c.count}`));

    // Get sample dress images
    const dressImages = await Image.find({ category: 'dress' }).limit(5);
    console.log('\n👗 Sample dress images:');
    dressImages.forEach(img => {
      console.log(`  - ${img.filename} (${(img.size / 1024).toFixed(1)} KB)`);
    });

    // Get sample filenames
    const allDress = await Image.find({ category: 'dress' }).select('filename').sort('filename');
    console.log(`\n📁 All dress filenames (${allDress.length} total):`);
    allDress.slice(0, 20).forEach(img => console.log(`  ${img.filename}`));
    if (allDress.length > 20) console.log(`  ... and ${allDress.length - 20} more`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkImages();
