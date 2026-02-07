const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }));

async function debugImage() {
  try {
    console.log('\n🔍 Checking image data...\n');
    
    const img = await Image.findById('698709fb144da170ad377cb6');
    
    if (!img) {
      console.log('❌ Image not found in database');
      return;
    }
    
    console.log('✅ Image found:');
    console.log(`  Filename: ${img.filename}`);
    console.log(`  MimeType: ${img.mimeType}`);
    console.log(`  Size: ${img.size} bytes`);
    console.log(`  Data type: ${typeof img.data}`);
    console.log(`  Data is Buffer: ${Buffer.isBuffer(img.data)}`);
    
    if (img.data) {
      const dataLength = Buffer.isBuffer(img.data) ? img.data.length : 'not buffer';
      console.log(`  Data length: ${dataLength}`);
    } else {
      console.log('  ❌ No data field!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

debugImage();
