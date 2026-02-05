# Product Import Guide for Evara Backend

## Overview
This guide explains how to import the 150 products into your Evara backend database.

## Files Included
1. **products_export.json** - JSON format for API import
2. **products_export.xlsx** - Excel format for manual import
3. **products_export.csv** - CSV format for bulk import

## Product Summary
- **Total Products**: 150
- **Dresses**: 50 products
- **Jewelry**: 50 products
- **Beauty Electronics**: 50 products
- **Price Range**: ₹1,499 - ₹99,999
- **Average Price**: ₹10,741

## Import Methods

### Method 1: API Import (Recommended)

Use the `/api/products/bulk-upload` endpoint with the JSON file:

```bash
curl -X POST http://your-backend-url/api/products/bulk-upload \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @products_export.json
```

### Method 2: Admin Dashboard Import

1. Log in to the Admin Dashboard (ID: admin, Password: subir)
2. Navigate to "Products" → "Bulk Upload"
3. Select the `products_export.xlsx` or `products_export.csv` file
4. Click "Upload and Import"
5. Review the import preview and confirm

### Method 3: MongoDB Direct Import

```bash
# Connect to MongoDB
mongo "mongodb://your-connection-string"

# Switch to evara database
use evara

# Import products
db.products.insertMany([
  // Paste contents from products_export.json
])
```

### Method 4: Node.js Script

Create an import script:

```javascript
const fs = require('fs');
const mongoose = require('mongoose');
const Product = require('./models/product.model');

const products = JSON.parse(fs.readFileSync('products_export.json', 'utf8'));

async function importProducts() {
  await mongoose.connect('mongodb://your-connection-string');
  
  for (const product of products) {
    await Product.create(product);
    console.log(`Imported: ${product.name}`);
  }
  
  console.log('Import complete!');
  process.exit(0);
}

importProducts().catch(console.error);
```

## Product Schema Mapping

| Field | Type | Description |
|-------|------|-------------|
| name | String | Product name |
| description | String | Product description |
| price | Number | Current price in INR |
| originalPrice | Number | Original price (for discounts) |
| category | String | 'dress', 'jewelry', or 'beauty' |
| subcategory | String | Specific subcategory |
| rating | Number | Average rating (1-5) |
| reviews | Number | Number of reviews |
| inStock | Boolean | Availability status |
| isNew | Boolean | New arrival flag |
| isBestseller | Boolean | Bestseller flag |
| colors | Array | Available colors |
| sizes | Array | Available sizes (for dresses) |
| image | String | Image path |

## Subcategories by Category

### Dresses (50 products)
- evening (8)
- workwear (6)
- cocktail (4)
- casual (7)
- ethnic (10)
- bridal (5)
- boho (2)
- party (3)
- vintage (1)
- jumpsuit (2)
- other (2)

### Jewelry (50 products)
- necklace (12)
- earrings (12)
- bracelet (8)
- ring (8)
- anklet (2)
- hair-accessory (2)
- nose-ring (1)
- accessory (1)
- hand-jewelry (1)
- set (1)
- other (2)

### Beauty Electronics (50 products)
- nail-tools (6)
- skincare-devices (14)
- hair-tools (7)
- eye-tools (3)
- foot-care (2)
- hair-removal (2)
- makeup-tools (3)
- body-care (1)
- skincare-tools (1)
- accessory (1)
- other (10)

## Image Files

All product images are located in:
```
/app/public/images/
├── dress-1.jpg to dress-50.jpg
├── jewelry-1.jpg to jewelry-50.jpg
└── beauty-1.jpg to beauty-50.jpg
```

Make sure to upload these images to your server/CDN and update the image paths accordingly.

## Post-Import Verification

After importing, verify the data:

```javascript
// Check product count
db.products.countDocuments()

// Check by category
db.products.aggregate([
  { $group: { _id: "$category", count: { $sum: 1 } } }
])

// Check price range
db.products.aggregate([
  { $group: { 
    _id: null, 
    minPrice: { $min: "$price" },
    maxPrice: { $max: "$price" },
    avgPrice: { $avg: "$price" }
  }}
])
```

## Troubleshooting

### Duplicate Products
If you encounter duplicate key errors, the products may already exist. Use:
```javascript
db.products.deleteMany({}) // Clear existing products first
```

### Image Path Issues
Update image paths in the database after uploading to your CDN:
```javascript
db.products.updateMany(
  {},
  [{ $set: { image: { $replaceOne: { input: "$image", find: "/images/", replacement: "https://your-cdn.com/images/" } } } }]
)
```

### Validation Errors
Ensure your Product model schema matches the export fields. Check for required fields and data types.

## Support

For any issues with product import, please:
1. Check the backend logs for error messages
2. Verify database connection
3. Ensure proper authentication/authorization
4. Validate file format and encoding (UTF-8)
