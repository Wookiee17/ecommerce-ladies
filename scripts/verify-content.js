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

async function verifyImageContent() {
  try {
    console.log('\n🔍 Verifying first dress image content:\n');
    
    // Get first dress image
    const img = await Image.findOne({ category: 'dress' }).sort({ filename: 1 });
    
    if (!img) {
      console.log('❌ No dress image found');
      return;
    }
    
    console.log('Filename:', img.filename);
    console.log('Size:', (img.size / 1024).toFixed(1), 'KB');
    
    // Save to verify visually
    const outputPath = path.join(__dirname, 'verify-dress-1.jpg');
    fs.writeFileSync(outputPath, img.data);
    console.log('💾 Saved to:', outputPath);
    console.log('\n✅ Please check the saved image to verify it is a dress');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

verifyImageContent();
