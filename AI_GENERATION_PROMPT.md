# AI GENERATION PROMPT FOR EVARA E-COMMERCE

## 🎯 Task
Generate 450 product images + 150 product listings for an e-commerce fashion website called "Evara"

## 📊 Output Structure

### 1. IMAGES (450 total)
Create a folder `evara_images/` with:

**Dress Images (150):**
- dress-1.jpg through dress-150.jpg

**Jewelry Images (150):**
- jewelry-1.jpg through jewelry-150.jpg

**Beauty Images (150):**
- beauty-1.jpg through beauty-150.jpg

### 2. PRODUCT LIST (150 products)
Create a file `products.json` with 150 products (50 per category)

## 🎨 Image Specifications

### Format Requirements:
- **Size**: 800x1000 pixels (portrait)
- **Format**: JPG
- **Background**: Clean white or light gradient
- **Style**: Professional product photography, studio lighting, e-commerce style
- **Quality**: High resolution, sharp focus

### Category Details:

#### DRESS (50 products = 150 images)
**Product Types:**
1. Evening Gowns (10 products)
2. Summer Dresses (10 products)  
3. Cocktail Dresses (10 products)
4. Maxi Dresses (10 products)
5. Party/Casual Dresses (10 products)

**Image Prompt Template:**
```
Professional product photography of [DRESS_TYPE] on white background, 
studio lighting, e-commerce style, centered composition, 
high quality, 800x1000, fashion photography
```

**Examples:**
- dress-1.jpg: Elegant red evening gown
- dress-2.jpg: Same gown, side view
- dress-3.jpg: Same gown, detail view
- dress-4.jpg: Blue summer sundress
- dress-5.jpg: Same dress, side view
- dress-6.jpg: Same dress, detail view
- Continue pattern...

#### JEWELRY (50 products = 150 images)
**Product Types:**
1. Gold Necklaces (10 products)
2. Diamond Rings (10 products)
3. Pearl Earrings (10 products)
4. Silver Bracelets (10 products)
5. Statement Jewelry Sets (10 products)

**Image Prompt Template:**
```
Professional product photography of [JEWELRY_TYPE] on white background,
luxury jewelry, studio lighting, macro detail, high quality,
800x1000, jewelry photography
```

#### BEAUTY (50 products = 150 images)
**Product Types:**
1. Lipsticks (10 products)
2. Perfumes (10 products)
3. Skincare Creams (10 products)
4. Makeup Palettes (10 products)
5. Serums/Oils (10 products)

**Image Prompt Template:**
```
Professional product photography of [BEAUTY_PRODUCT] on white background,
cosmetic product, studio lighting, high quality, 800x1000,
beauty product photography
```

## 📋 Product List Format

Create `products.json`:

```json
{
  "products": [
    {
      "name": "Elegant Evening Gown Red",
      "category": "dress",
      "subcategory": "formal",
      "description": "A stunning red evening gown perfect for formal occasions. Features elegant design with comfortable fit.",
      "shortDescription": "Elegant evening gown for special occasions",
      "price": 4999,
      "originalPrice": 7999,
      "colors": ["Red", "Black"],
      "sizes": ["S", "M", "L", "XL"],
      "images": ["dress-1.jpg", "dress-2.jpg", "dress-3.jpg"]
    },
    {
      "name": "Gold Diamond Necklace",
      "category": "jewelry",
      "subcategory": "general",
      "description": "Beautiful gold necklace with diamond pendant. Adds elegance to any outfit.",
      "shortDescription": "Elegant gold necklace with diamond",
      "price": 5999,
      "originalPrice": 8999,
      "colors": ["Gold"],
      "sizes": ["One Size"],
      "images": ["jewelry-1.jpg", "jewelry-2.jpg", "jewelry-3.jpg"]
    },
    {
      "name": "Luxury Red Lipstick",
      "category": "beauty",
      "subcategory": "general",
      "description": "Premium long-lasting red lipstick. High-quality formula for flawless look.",
      "shortDescription": "Luxury long-lasting lipstick",
      "price": 899,
      "originalPrice": 1299,
      "colors": ["Red", "Pink"],
      "sizes": ["One Size"],
      "images": ["beauty-1.jpg", "beauty-2.jpg", "beauty-3.jpg"]
    }
  ]
}
```

## 📐 Image Mapping Rules

**Each product needs 3 images:**
- Image 1: Front view (Primary)
- Image 2: Side/Alternate view
- Image 3: Detail/Close-up view

**Mapping Formula:**
- Product 1 uses images: category-1.jpg, category-2.jpg, category-3.jpg
- Product 2 uses images: category-4.jpg, category-5.jpg, category-6.jpg
- Product N uses images: category-{(N-1)*3+1}.jpg through category-{(N-1)*3+3}.jpg

## 🎨 Sample Image Generation Prompts

### For Image Generators (Midjourney/DALL-E/Stable Diffusion):

**Dress:**
```
professional product photography, elegant red evening gown dress, 
white background, studio lighting, centered, e-commerce style, 
800x1000, high quality, sharp focus, fashion photography --ar 4:5
```

**Jewelry:**
```
professional product photography, gold diamond necklace, 
white background, studio lighting, luxury jewelry, 
800x1000, high quality, macro detail --ar 4:5
```

**Beauty:**
```
professional product photography, red lipstick cosmetic product, 
white background, studio lighting, 800x1000, 
high quality, beauty product photography --ar 4:5
```

## ✅ Final Deliverables

1. **Folder**: `evara_images/` containing 450 JPG images
2. **File**: `products.json` containing 150 product records
3. Both should follow exact naming and structure above

Once generated, share the complete folder and I'll upload everything to the database!
