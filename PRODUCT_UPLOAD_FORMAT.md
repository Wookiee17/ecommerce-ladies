# EVARA PRODUCT & IMAGE UPLOAD FORMAT

## 📁 Folder Structure

Create a folder named `evara_images` with this exact structure:

```
evara_images/
├── dress-1.jpg
├── dress-2.jpg
├── dress-3.jpg
├── ... (continue for each product)
├── jewelry-1.jpg
├── jewelry-2.jpg
├── jewelry-3.jpg
├── ...
├── beauty-1.jpg
├── beauty-2.jpg
├── beauty-3.jpg
└── ...
```

## 📝 Naming Convention (CRITICAL - Must Follow Exactly)

### Format: `{category}-{number}.jpg`

- **category**: `dress`, `jewelry`, or `beauty` (lowercase)
- **number**: Sequential number starting from 1 (dress-1, dress-2, etc.)
- **extension**: `.jpg` only

### Examples:
- ✅ `dress-1.jpg`, `dress-2.jpg`, `dress-3.jpg`
- ✅ `jewelry-1.jpg`, `jewelry-2.jpg`, `jewelry-3.jpg`
- ✅ `beauty-1.jpg`, `beauty-2.jpg`, `beauty-3.jpg`
- ❌ `Dress-1.jpg` (wrong case)
- ❌ `dress_1.jpg` (wrong separator)
- ❌ `dress-001.jpg` (leading zeros)

## 📊 Product to Image Mapping

Each product gets **3 images** (front, side, detail views):

| Product # | Category | Primary Image | Secondary Images |
|-----------|----------|---------------|------------------|
| Product 1 | dress | dress-1.jpg | dress-2.jpg, dress-3.jpg |
| Product 2 | dress | dress-4.jpg | dress-5.jpg, dress-6.jpg |
| Product 3 | dress | dress-7.jpg | dress-8.jpg, dress-9.jpg |
| ... | ... | ... | ... |
| Product 1 | jewelry | jewelry-1.jpg | jewelry-2.jpg, jewelry-3.jpg |
| Product 2 | jewelry | jewelry-4.jpg | jewelry-5.jpg, jewelry-6.jpg |
| ... | ... | ... | ... |

### Formula:
- **Primary Image**: `{category}-{((productIndex * 3) + 1)}.jpg`
- **Secondary 1**: `{category}-{((productIndex * 3) + 2)}.jpg`
- **Secondary 2**: `{category}-{((productIndex * 3) + 3)}.jpg`

## 📋 Product Details Template

For each product, provide:

```json
{
  "products": [
    {
      "category": "dress",
      "name": "Elegant Evening Gown",
      "description": "A beautiful evening gown perfect for formal occasions",
      "price": 2999,
      "originalPrice": 4999,
      "colors": ["Red", "Black", "Navy"],
      "sizes": ["S", "M", "L", "XL"],
      "images": ["dress-1.jpg", "dress-2.jpg", "dress-3.jpg"]
    },
    {
      "category": "jewelry",
      "name": "Gold Diamond Necklace",
      "description": "Elegant gold necklace with diamond pendant",
      "price": 5999,
      "originalPrice": 8999,
      "colors": ["Gold"],
      "sizes": ["One Size"],
      "images": ["jewelry-1.jpg", "jewelry-2.jpg", "jewelry-3.jpg"]
    },
    {
      "category": "beauty",
      "name": "Luxury Lipstick Set",
      "description": "Premium long-lasting lipstick collection",
      "price": 899,
      "originalPrice": 1299,
      "colors": ["Red", "Pink", "Nude"],
      "sizes": ["One Size"],
      "images": ["beauty-1.jpg", "beauty-2.jpg", "beauty-3.jpg"]
    }
  ]
}
```

## ✅ Requirements Checklist

### Images:
- [ ] All images are `.jpg` format
- [ ] All images are at least 800x1000 pixels
- [ ] File names follow exact format: `category-number.jpg`
- [ ] No spaces or special characters in filenames
- [ ] Each product has exactly 3 images
- [ ] Images are clear, professional product photos

### Categories:
- [ ] **Dress**: Women's clothing (dresses, gowns, etc.)
- [ ] **Jewelry**: Accessories (necklaces, earrings, rings, etc.)
- [ ] **Beauty**: Cosmetics (lipstick, makeup, skincare, etc.)

## 📤 How to Share

1. Create the `evara_images` folder with all images
2. Share the complete folder with me
3. I'll upload all images to the database
4. I'll create the products with proper image mappings

## 🎯 Example for 50 Products per Category (150 products total = 450 images)

### Dress (50 products = 150 images):
- dress-1.jpg through dress-150.jpg

### Jewelry (50 products = 150 images):
- jewelry-1.jpg through jewelry-150.jpg

### Beauty (50 products = 150 images):
- beauty-1.jpg through beauty-150.jpg

---

**Total**: 150 products, 450 images

Once you share the folder, I'll handle the database upload and product creation!
