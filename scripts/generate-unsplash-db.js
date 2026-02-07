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
const imageSchema = new mongoose.Schema({
  filename: String,
  mimeType: String,
  size: Number,
  data: Buffer,
  category: String,
  isPrimary: Boolean,
  externalUrl: String
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

// Product Schema
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

// Unsplash keywords for each category
const DRESS_KEYWORDS = [
  'women-dress', 'evening-gown', 'summer-dress', 'cocktail-dress', 'floral-dress',
  'maxi-dress', 'party-dress', 'casual-dress', 'formal-dress', 'wedding-dress',
  'vintage-dress', 'bohemian-dress', 'elegant-dress', 'fashion-dress', 'sundress'
];

const JEWELRY_KEYWORDS = [
  'gold-necklace', 'diamond-ring', 'pearl-earrings', 'silver-bracelet',
  'luxury-jewelry', 'gold-chain', 'jewelry-set', 'diamond-jewelry',
  'fashion-jewelry', 'vintage-jewelry', 'wedding-ring', 'statement-necklace',
  'earrings-set', 'pendant-necklace', 'jewelry-collection'
];

const BEAUTY_KEYWORDS = [
  'lipstick', 'makeup-palette', 'skincare-product', 'perfume-bottle',
  'cosmetics', 'beauty-product', 'foundation-makeup', 'mascara',
  'eyeshadow-palette', 'luxury-cosmetics', 'nail-polish', 'face-cream',
  'serum-bottle', 'makeup-brushes', 'beauty-accessories'
];

// Download image from Unsplash (follows redirects)
function downloadImage(keyword, seed) {
  const url = `https://source.unsplash.com/800x1000/?${keyword}&sig=${seed}`;
  
  return new Promise((resolve, reject) => {
    const doRequest = (currentUrl, redirects = 0) => {
      if (redirects > 5) {
        reject(new Error('Too many redirects'));
        return;
      }

      https.get(currentUrl, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          doRequest(res.headers.location, redirects + 1);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Status ${res.statusCode}`));
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

// Generate and store images for a category
async function generateImages(category, keywords, count) {
  console.log(`\n🎨 Generating ${count} ${category} images from Unsplash...\n`);
  
  const images = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 1; i <= count; i++) {
    const keyword = keywords[(i - 1) % keywords.length];
    const filename = `${category}-${i}.jpg`;
    
    try {
      const data = await downloadImage(keyword, i);
      
      const image = new Image({
        filename: filename,
        mimeType: 'image/jpeg',
        size: data.length,
        data: data,
        category: category,
        isPrimary: false
      });

      await image.save();
      images.push(image);
      success++;
      
      if (success % 10 === 0 || i === count) {
        console.log(`  ✅ Generated ${success}/${count} images (${(data.length/1024).toFixed(1)} KB avg)`);
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      failed++;
      if (failed % 5 === 0) {
        console.log(`  ❌ ${failed} failed so far...`);
      }
    }
  }
  
  console.log(`\n📊 ${category} done: ${success} success, ${failed} failed`);
  return images;
}

// Generate product details
function generateProductDetails(category, index) {
  const ADJECTIVES = ['Elegant', 'Modern', 'Classic', 'Vintage', 'Chic', 'Luxury', 'Minimalist', 'Bohemian', 'Urban', 'Sophisticated'];
  const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver', 'Navy', 'Pink', 'Purple'];
  
  const adj = ADJECTIVES[index % ADJECTIVES.length];
  const color = COLORS[index % COLORS.length];
  const randomNum = Math.floor(Math.random() * 900) + 100;
  
  let name, description, shortDescription, subcategory;
  
  if (category === 'dress') {
    const TYPES = ['Evening Gown', 'Summer Dress', 'Cocktail Dress', 'Maxi Dress', 'Party Dress'];
    const type = TYPES[index % TYPES.length];
    name = `${adj} ${type} ${randomNum}`;
    description = `A stunning ${type.toLowerCase()} in ${color}. Perfect for special occasions with elegant design and comfortable fit.`;
    shortDescription = `Elegant ${type.toLowerCase()} for your wardrobe.`;
    subcategory = index % 2 === 0 ? 'casual' : 'formal';
  } else if (category === 'jewelry') {
    const TYPES = ['Necklace', 'Bracelet', 'Earrings', 'Ring', 'Pendant'];
    const type = TYPES[index % TYPES.length];
    name = `${adj} ${type} ${randomNum}`;
    description = `Beautiful ${type.toLowerCase()} crafted with precision. Adds elegance to any outfit.`;
    shortDescription = `Stunning ${type.toLowerCase()} for timeless beauty.`;
    subcategory = 'general';
  } else {
    const TYPES = ['Lipstick', 'Foundation', 'Serum', 'Palette', 'Cream'];
    const type = TYPES[index % TYPES.length];
    name = `${adj} ${type} ${randomNum}`;
    description = `Premium ${type.toLowerCase()} for flawless beauty. Long-lasting and high-quality formula.`;
    shortDescription = `Luxury ${type.toLowerCase()} for radiant look.`;
    subcategory = 'general';
  }
  
  const price = category === 'dress' 
    ? Math.floor(Math.random() * 12000) + 1500
    : category === 'jewelry'
    ? Math.floor(Math.random() * 8000) + 1000
    : Math.floor(Math.random() * 1500) + 300;
    
  const originalPrice = Math.floor(price * 1.5);
  
  return {
    name, description, shortDescription, price, originalPrice,
    category, subcategory,
    colors: category === 'dress' ? [{ name: color }, { name: 'Black' }] : [{ name: color }],
    sizes: category === 'dress' 
      ? [{ name: 'S', inStock: true }, { name: 'M', inStock: true }, { name: 'L', inStock: true }]
      : [{ name: 'One Size', inStock: true }]
  };
}

// Create products in database
async function createProducts(category, count, images) {
  console.log(`\n🏪 Creating ${count} ${category} products...\n`);
  
  // Get or create seller
  const User = require('../backend/src/models/user.model');
  const bcrypt = require('bcryptjs');
  
  let seller = await User.findOne({ role: 'seller' });
  if (!seller) {
    const hashedPassword = await bcrypt.hash('seller123', 10);
    seller = await User.create({
      name: 'Evara Store',
      email: 'store@evara.com',
      password: hashedPassword,
      role: 'seller',
      isEmailVerified: true,
      sellerInfo: { businessName: 'Evara Fashion Store' }
    });
  }
  
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const details = generateProductDetails(category, i);
    
    // Get 3 images for this product
    const startIndex = i * 3;
    const productImages = [
      images[startIndex],
      images[startIndex + 1],
      images[startIndex + 2]
    ].filter(img => img).map((img, idx) => ({
      url: `/api/images/${img._id}`,
      alt: `${category} view`,
      isPrimary: idx === 0
    }));
    
    if (productImages.length === 0) {
      console.log(`  ⚠️  No images for product ${i + 1}`);
      continue;
    }
    
    const product = {
      name: details.name,
      description: details.description,
      shortDescription: details.shortDescription,
      price: details.price,
      originalPrice: details.originalPrice,
      category: details.category,
      subcategory: details.subcategory,
      images: productImages,
      variants: {
        colors: details.colors,
        sizes: details.sizes
      },
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 500),
      isActive: true,
      inStock: true,
      stock: Math.floor(Math.random() * 90) + 10,
      isNew: Math.random() > 0.8,
      isBestseller: Math.random() > 0.8,
      seller: seller._id
    };
    
    products.push(product);
  }
  
  if (products.length > 0) {
    await Product.insertMany(products);
  }
  
  console.log(`✅ Created ${products.length} ${category} products`);
  return products.length;
}

// Main execution
async function main() {
  try {
    console.log('🚀 STARTING: Download from Unsplash → Store in MongoDB → Create Products\n');
    
    // Clear existing
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await Image.deleteMany({});
    console.log('✅ Database cleared\n');
    
    // Generate all images
    const dressImages = await generateImages('dress', DRESS_KEYWORDS, 150);
    const jewelryImages = await generateImages('jewelry', JEWELRY_KEYWORDS, 150);
    const beautyImages = await generateImages('beauty', BEAUTY_KEYWORDS, 150);
    
    const totalImages = dressImages.length + jewelryImages.length + beautyImages.length;
    console.log(`\n📊 Total images in database: ${totalImages}`);
    
    // Create products
    await createProducts('dress', 50, dressImages);
    await createProducts('jewelry', 50, jewelryImages);
    await createProducts('beauty', 50, beautyImages);
    
    // Final count
    const finalProducts = await Product.countDocuments();
    const finalImages = await Image.countDocuments();
    
    console.log('\n✨ COMPLETE!');
    console.log(`   • ${finalImages} images stored in MongoDB`);
    console.log(`   • ${finalProducts} products created`);
    console.log('   • All data ready!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

main();
