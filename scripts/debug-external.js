const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Image Schema with strict false
const imageSchema = new mongoose.Schema({}, { strict: false });
const Image = mongoose.model('Image', imageSchema);

async function debug() {
  try {
    console.log('\n🔍 Debugging externalUrl access:\n');
    
    // Find one dress image using Mongoose document (not lean)
    const img = await Image.findOne({ category: 'dress' });
    
    console.log('Image ID:', img._id);
    console.log('Filename:', img.filename);
    console.log('External URL (direct):', img.externalUrl);
    console.log('Get externalUrl:', img.get('externalUrl'));
    console.log('toObject externalUrl:', img.toObject().externalUrl);
    console.log('JSON stringify:', JSON.parse(JSON.stringify(img)).externalUrl);
    console.log('All keys:', Object.keys(img.toObject()));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

debug();
