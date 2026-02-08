const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../src/models/product.model');

const DISCOUNT_PERCENTAGE = 30;
const DISCOUNT_FACTOR = 1 - DISCOUNT_PERCENTAGE / 100;

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in .env');
  }

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

async function applyDiscount() {
  const products = await Product.find({});
  let updatedCount = 0;

  for (const product of products) {
    const basePrice = product.originalPrice && product.originalPrice > 0
      ? product.originalPrice
      : product.price;

    if (!basePrice || basePrice <= 0) {
      continue;
    }

    const discountedPrice = roundPrice(basePrice * DISCOUNT_FACTOR);

    // Skip if already discounted to this value
    if (Math.abs(product.price - discountedPrice) < 0.01) {
      continue;
    }

    // Preserve original price for future reference
    if (!product.originalPrice || product.originalPrice < basePrice) {
      product.originalPrice = basePrice;
    }

    product.price = discountedPrice;
    await product.save();
    updatedCount += 1;
  }

  console.log(`✨ Updated ${updatedCount} products with a ${DISCOUNT_PERCENTAGE}% discount`);
}

async function main() {
  try {
    await connect();
    await applyDiscount();
  } catch (error) {
    console.error('❌ Failed to apply discount:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 MongoDB connection closed');
  }
}

main();
