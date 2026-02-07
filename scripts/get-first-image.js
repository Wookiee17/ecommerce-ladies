const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected'))
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });

const Image = mongoose.model('Image', new mongoose.Schema({}, { strict: false }), 'images');

async function getFirstImageId() {
  try {
    const img = await Image.findOne().select('_id filename').lean();
    if (img) {
      console.log(`First image ID: ${img._id}`);
      console.log(`Filename: ${img.filename}`);
      console.log(`\nTest URL: https://evara-backend.onrender.com/api/images/${img._id}`);
    } else {
      console.log('No images found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

getFirstImageId();
