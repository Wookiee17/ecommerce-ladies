const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }), 'images');

async function checkSpecificImage() {
  try {
    const imageId = '698730524c36edb9aedf349a';
    console.log(`Looking for image with ID: ${imageId}`);
    
    const image = await Image.findById(imageId).lean();
    
    if (image) {
      console.log('✅ Image found!');
      console.log('  Filename:', image.filename);
      console.log('  MIME Type:', image.mimeType);
      console.log('  Has data:', !!image.data);
      if (image.data) {
        console.log('  Data type:', typeof image.data);
        console.log('  Is Buffer:', Buffer.isBuffer(image.data));
        console.log('  _bsontype:', image.data._bsontype);
      }
    } else {
      console.log('❌ Image NOT found in database');
      
      // List first few images to see what IDs exist
      const allImages = await Image.find({}).limit(5).lean();
      console.log('\nAvailable images:');
      allImages.forEach(img => {
        console.log(`  ${img._id} - ${img.filename}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkSpecificImage();
