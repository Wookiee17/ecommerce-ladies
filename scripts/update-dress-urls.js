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
const imageSchema = new mongoose.Schema({}, { strict: false });
const Image = mongoose.model('Image', imageSchema);

// 10 reliable dress images from Unsplash
const DRESS_IMAGES = [
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1585487000169-5e15dbfa2166?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&h=1000&fit=crop',
  'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&h=1000&fit=crop'
];

async function fixDressImages() {
  try {
    console.log('\n🔄 Updating dress images to use external Unsplash URLs...\n');
    
    // Get all dress images
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).lean();
    console.log(`Found ${images.length} dress images\n`);
    
    let updated = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      // Cycle through the 10 dress images
      const dressUrl = DRESS_IMAGES[i % DRESS_IMAGES.length];
      
      // Update the image to store the external URL instead of binary data
      await Image.updateOne(
        { _id: img._id },
        { 
          $set: { 
            // Add a field to indicate this is an external URL
            externalUrl: dressUrl,
            updatedAt: new Date()
          }
        }
      );
      
      updated++;
      if (updated % 25 === 0 || updated === images.length) {
        console.log(`  ✅ Updated ${updated}/${images.length} images`);
      }
    }
    
    console.log(`\n🎉 Done! Updated ${updated} dress image references`);
    
    // Now we need to update the product routes to check for externalUrl
    console.log('\n⚠️  NOTE: You also need to update the product seed route to use externalUrl when available');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

fixDressImages();
