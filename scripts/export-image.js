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

const Image = mongoose.model('Image', new mongoose.Schema({
  filename: String, mimeType: String, size: Number, data: Buffer, category: String
}, { strict: false }));

async function exportImage() {
  try {
    const img = await Image.findById('698709fb144da170ad377cb6');
    
    if (!img) {
      console.log('❌ Image not found');
      return;
    }
    
    console.log('Image:', img.filename, 'Type:', typeof img.data, 'Buffer?', Buffer.isBuffer(img.data));
    
    // Handle MongoDB Binary
    let imageData = img.data;
    if (imageData && typeof imageData === 'object' && !Buffer.isBuffer(imageData)) {
      console.log('Object keys:', Object.keys(imageData));
      if (imageData._bsontype === 'Binary' || imageData.buffer) {
        imageData = Buffer.from(imageData.buffer);
        console.log('Converted from Binary, length:', imageData.length);
      }
    }
    
    // Save to file
    const outputPath = path.join(__dirname, 'test-export.jpg');
    fs.writeFileSync(outputPath, imageData);
    console.log('✅ Exported to:', outputPath);
    console.log('First 4 bytes (hex):', imageData.slice(0, 4).toString('hex'));
    console.log('Is JPEG:', imageData.slice(0, 2).toString('hex') === 'ffd8');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

exportImage();
