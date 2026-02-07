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

// Get dress image from Unsplash
function getDressImageUrl(seed) {
  const keywords = [
    'women-dress',
    'fashion-dress', 
    'elegant-dress',
    'summer-dress',
    'cocktail-dress',
    'evening-gown',
    'casual-dress',
    'party-dress'
  ];
  const keyword = keywords[seed % keywords.length];
  return `https://source.unsplash.com/800x1000/?${keyword}&sig=${seed}`;
}

// Download image from URL (follow redirects)
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const doRequest = (currentUrl, redirects = 0) => {
      if (redirects > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      https.get(currentUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow redirect
          doRequest(res.headers.location, redirects + 1);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Status Code: ${res.statusCode}`));
          return;
        }
        
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    };

    doRequest(url);
  });
}

async function replaceDressImages() {
  try {
    console.log('\n🔄 Replacing dress images with Unsplash dress photos...\n');
    
    // Get all dress images
    const images = await Image.find({ category: 'dress' }).sort({ filename: 1 }).lean();
    console.log(`Found ${images.length} dress images to replace\n`);
    
    let success = 0;
    let failed = 0;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const seed = i + 1;
      
      try {
        const imageUrl = getDressImageUrl(seed);
        console.log(`  Downloading ${img.filename} from ${imageUrl}...`);
        
        const imageBuffer = await downloadImage(imageUrl);
        
        // Update the image in database
        await Image.updateOne(
          { _id: img._id },
          { 
            $set: { 
              data: imageBuffer,
              size: imageBuffer.length,
              mimeType: 'image/jpeg',
              updatedAt: new Date()
            } 
          }
        );
        
        success++;
        console.log(`  ✅ ${img.filename} updated (${(imageBuffer.length/1024).toFixed(1)} KB)`);
        
        // Delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        failed++;
        console.log(`  ❌ ${img.filename} failed: ${err.message}`);
        // Continue with next image
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
