const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://s9475220017_db_user:823Ol9vlrL5HkqSF@cluster0.sqq7cky.mongodb.net/evara?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Image Schema
const imageSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  data: Buffer,
  category: String,
  productId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isPrimary: Boolean,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

// Product Schema
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model('Product', productSchema);

const imagesDir = path.join(__dirname, '..', 'frontend', 'src', 'evara_images');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// AI Image Prompts
const DRESS_TYPES = [
  'elegant evening gown', 'summer sundress', 'cocktail dress', 'maxi dress', 
  'floral party dress', 'casual wrap dress', 'formal ball gown', 'bohemian midi dress',
  'vintage tea dress', 'modern shift dress', 'lace wedding dress', 'satin slip dress',
  'chiffon maxi', 'cotton sundress', 'velvet evening dress', 'silk cocktail dress',
  'pleated midi', 'off-shoulder dress', 'halter neck gown', 'fit and flare dress',
  'bodycon dress', 'A-line dress', 'shirt dress', 'smock dress',
  'puff sleeve dress', 'tiered maxi', 'wrap midi', 'slip dress',
  'sequin party dress', 'denim dress'
];

const JEWELRY_TYPES = [
  'gold necklace', 'silver bracelet', 'diamond ring', 'pearl earrings',
  'sapphire pendant', 'ruby choker', 'emerald brooch', 'platinum chain',
  'rose gold bangle', 'tennis bracelet', 'hoop earrings', 'stud earrings',
  'statement necklace', 'layered chain', 'charm bracelet', 'cocktail ring',
  'diamond pendant', 'gold anklet', 'silver cuff', 'beaded necklace',
  'crystal tiara', 'vintage brooch', 'art deco earrings', 'minimalist ring',
  'boho bracelet', 'luxury watch', 'pearl necklace', 'gemstone earrings',
  'gold chain', 'diamond bracelet'
];

const BEAUTY_TYPES = [
  'red lipstick', 'nude foundation', 'black mascara', 'pink blush',
  'eyeshadow palette', 'serum bottle', 'moisturizer jar', 'perfume bottle',
  'lip gloss set', 'eyeliner pencil', 'concealer stick', 'highlighter palette',
  'bronzer compact', 'face cream', 'body lotion', 'hair oil',
  'nail polish set', 'makeup brush set', 'lip balm', 'cleansing foam',
  'toner bottle', 'face mask', 'eye cream', 'BB cream',
  'CC cream', 'setting spray', 'makeup remover', 'facial oil',
  'exfoliating scrub', 'sunscreen lotion'
];

// Generate AI image URL using Pollinations
function generateImageUrl(category, type, seed) {
  let prompt;
  
  if (category === 'dress') {
    prompt = `professional product photography of a ${type}, white background, studio lighting, high quality, e-commerce style, centered, 4k resolution`;
  } else if (category === 'jewelry') {
    prompt = `professional product photography of ${type} on white background, luxury jewelry, studio lighting, high quality, e-commerce style, centered, 4k resolution`;
  } else {
    prompt = `professional product photography of ${type} on white background, cosmetic product, studio lighting, high quality, e-commerce style, centered, 4k resolution`;
  }
  
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${seed}&width=800&height=1000`;
}

// Download image
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

// Generate all images for a category
async function generateCategoryImages(category, types, count) {
  console.log(`\n🎨 Generating ${count} ${category} images...\n`);
  
  const images = [];
  let success = 0;
  let failed = 0;
  
  for (let i = 1; i <= count; i++) {
    const type = types[(i - 1) % types.length];
    const filename = `${category}-${i}.jpg`;
    const filepath = path.join(imagesDir, filename);
    
    // Skip if already exists
    if (fs.existsSync(filepath)) {
      console.log(`  ⏭️  ${filename} already exists`);
      const data = fs.readFileSync(filepath);
      images.push({ filename, data, size: data.length, category });
      success++;
      continue;
    }
    
    try {
      const url = generateImageUrl(category, type, i);
      const data = await downloadImage(url);
      
      // Save to file
      fs.writeFileSync(filepath, data);
      
      images.push({ filename, data, size: data.length, category });
      success++;
      
      if (success % 10 === 0 || i === count) {
        console.log(`  ✅ Generated ${success}/${count} images`);
      }
      
      // Small delay
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      failed++;
      console.log(`  ❌ ${filename} failed: ${err.message}`);
    }
  }
  
  console.log(`\n📊 ${category} complete: ${success} success, ${failed} failed`);
  return images;
}

// Upload images to database
async function uploadImagesToDb(images) {
  console.log(`\n📤 Uploading ${images.length} images to MongoDB...\n`);
  
  let uploaded = 0;
  
  for (const img of images) {
    try {
      const image = new Image({
        filename: img.filename,
        originalName: img.filename,
        mimeType: 'image/jpeg',
        size: img.size,
        data: img.data,
        category: img.category,
        isPrimary: false
      });

      await image.save();
      uploaded++;
      
      if (uploaded % 50 === 0 || uploaded === images.length) {
        console.log(`  ✅ Uploaded ${uploaded}/${images.length}`);
      }
    } catch (err) {
      console.log(`  ❌ Failed to upload ${img.filename}: ${err.message}`);
    }
  }
  
  console.log(`\n🎉 Uploaded ${uploaded} images to database`);
  return uploaded;
}

// Generate product details
function generateProductDetails(category, index) {
  const ADJECTIVES = ['Elegant', 'Modern', 'Classic', 'Vintage', 'Chic', 'Luxury', 'Minimalist', 'Bohemian', 'Urban', 'Sophisticated', 'Stylish', 'Premium', 'Designer', 'Trendy', 'Exclusive'];
  const COLORS = ['Red', 'Blue', 'Green', 'Black', 'White', 'Gold', 'Silver', 'Navy', 'Pink', 'Purple', 'Rose Gold', 'Champagne', 'Emerald', 'Ruby'];
  
  let type, subcategory;
  
  if (category === 'dress') {
    type = DRESS_TYPES[index % DRESS_TYPES.length];
    subcategory = index % 2 === 0 ? 'casual' : 'formal';
  } else if (category === 'jewelry') {
    type = JEWELRY_TYPES[index % JEWELRY_TYPES.length];
    subcategory = 'general';
  } else {
    type = BEAUTY_TYPES[index % BEAUTY_TYPES.length];
    subcategory = 'general';
  }
  
  const adj = ADJECTIVES[index % ADJECTIVES.length];
  const color = COLORS[index % COLORS.length];
  const randomNum = Math.floor(Math.random() * 900) + 100;
  
  const name = `${adj} ${type} ${randomNum}`;
  
  let description, shortDescription;
  if (category === 'dress') {
    description = `This exquisite ${type} in ${color} is perfect for any special occasion. Made with premium quality fabric and attention to detail. Features elegant design, comfortable fit, and timeless style that will make you stand out.`;
    shortDescription = `A ${adj.toLowerCase()} ${type} for your special moments.`;
  } else if (category === 'jewelry') {
    description = `Stunning ${type} crafted with precision and elegance. This piece adds a touch of sophistication to any outfit. Perfect for daily wear or special occasions.`;
    shortDescription = `Elegant ${type} for timeless beauty.`;
  } else {
    description = `Premium ${type} for a flawless look. High-quality formula that lasts all day. Perfect for enhancing your natural beauty and completing your makeup routine.`;
    shortDescription = `Luxury ${type} for radiant beauty.`;
  }
  
  const price = category === 'dress' 
    ? Math.floor(Math.random() * 12000) + 1500  // 1500-13500
    : category === 'jewelry'
    ? Math.floor(Math.random() * 8000) + 1000   // 1000-9000
    : Math.floor(Math.random() * 1500) + 300;  // 300-1800
    
  const originalPrice = Math.floor(price * (1.3 + Math.random() * 0.4)); // 30-70% higher
  
  return {
    name,
    description,
    shortDescription,
    price,
    originalPrice,
    category,
    subcategory,
    colors: category === 'dress' 
      ? [{ name: color }, { name: 'Black' }]
      : [{ name: color }],
    sizes: category === 'dress'
      ? [{ name: 'S', inStock: true }, { name: 'M', inStock: true }, { name: 'L', inStock: true }, { name: 'XL', inStock: true }]
      : [{ name: 'One Size', inStock: true }]
  };
}

// Create products in database
async function createProducts(category, count) {
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
  
  // Get images for this category
  const images = await Image.find({ category }).sort({ filename: 1 });
  
  const products = [];
  
  for (let i = 0; i < count; i++) {
    const details = generateProductDetails(category, i);
    
    // Get 3 images for this product
    const imgIndex = i * 3;
    const productImages = [
      images[imgIndex],
      images[imgIndex + 1],
      images[imgIndex + 2]
    ].filter(img => img).map((img, idx) => ({
      url: `/api/images/${img._id}`,
      alt: `${category} view`,
      isPrimary: idx === 0
    }));
    
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
  
  await Product.insertMany(products);
  console.log(`✅ Created ${products.length} ${category} products`);
  return products.length;
}

// Main execution
async function main() {
  try {
    console.log('🚀 STARTING FULL AI GENERATION PROCESS\n');
    
    // Clear existing
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await Image.deleteMany({});
    console.log('✅ Database cleared\n');
    
    // Generate all images
    const dressImages = await generateCategoryImages('dress', DRESS_TYPES, 150);
    const jewelryImages = await generateCategoryImages('jewelry', JEWELRY_TYPES, 150);
    const beautyImages = await generateCategoryImages('beauty', BEAUTY_TYPES, 150);
    
    const allImages = [...dressImages, ...jewelryImages, ...beautyImages];
    console.log(`\n🎨 Total images generated: ${allImages.length}`);
    
    // Upload to database
    await uploadImagesToDb(allImages);
    
    // Create products
    await createProducts('dress', 50);
    await createProducts('jewelry', 50);
    await createProducts('beauty', 50);
    
    console.log('\n✨ COMPLETE! Generated:');
    console.log('   • 450 AI images');
    console.log('   • 150 products (50 per category)');
    console.log('   • All saved to database');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

main();
