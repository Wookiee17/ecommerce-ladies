const mongoose = require('mongoose');
const https = require('https');
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

// Generate dress image using pollinations.ai
function generateDressImage(seed) {
  const prompts = [
    'elegant red cocktail dress on white background, product photography, studio lighting, high quality, 4k',
    'beautiful blue evening gown on white background, product photography, studio lighting, high quality, 4k',
    'stylish black party dress on white background, product photography, studio lighting, high quality, 4k',
    'gorgeous floral summer dress on white background, product photography, studio lighting, high quality, 4k',
    'elegant white wedding dress on white background, product photography, studio lighting, high quality, 4k'
  ];
  const prompt = prompts[seed % prompts.length];
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=800&height=1000`;
}

// Download image from URL
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status Code: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

async function replaceDressImages() {
  try {
    console.log('\n🔄 Replacing dress images with AI-generated dresses...\n');
    
    // Get all dress images
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).lean();
    console.log(`Found ${images.length} dress images to replace\n`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const seed = i + 1;
      
      try {
        const imageUrl = generateDressImage(seed);
        const imageBuffer = await downloadImage(imageUrl);
        
        // Update the image in database
        await Image.updateOne(
          { _id: img._id },
          { 
            $set: { 
              data: imageBuffer,
              size: imageBuffer.length,
              updatedAt: new Date()
            } 
          }
        );
        
        success++;
        if (success % 25 === 0 || success === images.length) {
          console.log(`  ✅ Updated ${success}/${images.length} images`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        failed++;
        console.log(`  ❌ Failed ${img.filename}: ${err.message}`);
      }
    }
    
    console.log(`\n🎉 Done! Updated ${success} images, ${failed} failed`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

replaceDressImages();
