const UserTryOn = require('../models/userTryOn.model');
const Image = require('../models/image.model');
const Product = require('../models/product.model');
const axios = require('axios');
const FormData = require('form-data');

// Upload and store user's try-on photo
exports.uploadUserPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const userImage = req.files?.userImage?.[0];

    if (!userImage) {
      return res.status(400).json({ success: false, message: 'No user image provided' });
    }

    // Store image in database
    const imageDoc = new Image({
      filename: `user-${userId}-photo.jpg`,
      mimeType: 'image/jpeg',
      data: userImage.buffer,
      uploadedBy: userId
    });
    await imageDoc.save();

    // Update or create UserTryOn record
    const imageUrl = `/api/images/${imageDoc._id}`;
    await UserTryOn.findOneAndUpdate(
      { userId },
      {
        $set: {
          'userPhoto.imageId': imageDoc._id,
          'userPhoto.url': imageUrl,
          'userPhoto.uploadedAt': new Date()
        }
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'User photo uploaded successfully',
      data: {
        imageUrl,
        imageId: imageDoc._id
      }
    });
  } catch (error) {
    console.error('Upload user photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload user photo' });
  }
};

// Get user's try-on data (photo + generated images)
exports.getUserTryOnData = async (req, res) => {
  try {
    const userId = req.user.id;

    const userTryOn = await UserTryOn.findOne({ userId })
      .populate('generatedImages.productId', 'name images');

    if (!userTryOn) {
      return res.json({
        success: true,
        data: {
          hasPhoto: false,
          generatedImages: [],
          rateLimit: { allowed: true, remaining: 10, resetAt: new Date(Date.now() + 10 * 60 * 1000) }
        }
      });
    }

    // Check rate limit
    const rateLimit = await UserTryOn.checkRateLimit(userId);

    res.json({
      success: true,
      data: {
        hasPhoto: !!userTryOn.userPhoto?.url,
        userPhotoUrl: userTryOn.userPhoto?.url,
        generatedImages: userTryOn.generatedImages || [],
        rateLimit
      }
    });
  } catch (error) {
    console.error('Get user try-on data error:', error);
    res.status(500).json({ success: false, message: 'Failed to get user try-on data' });
  }
};

// Delete user's photo
exports.deleteUserPhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    const userTryOn = await UserTryOn.findOne({ userId });
    if (userTryOn?.userPhoto?.imageId) {
      await Image.findByIdAndDelete(userTryOn.userPhoto.imageId);
    }

    await UserTryOn.findOneAndUpdate(
      { userId },
      { $unset: { userPhoto: 1, generatedImages: 1 } }
    );

    res.json({ success: true, message: 'User photo deleted successfully' });
  } catch (error) {
    console.error('Delete user photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user photo' });
  }
};

// Check rate limit
exports.checkRateLimit = async (req, res) => {
  try {
    const userId = req.user.id;
    const rateLimit = await UserTryOn.checkRateLimit(userId);

    res.json({
      success: true,
      data: rateLimit
    });
  } catch (error) {
    console.error('Check rate limit error:', error);
    res.status(500).json({ success: false, message: 'Failed to check rate limit' });
  }
};

// Generate try-on for a single product
exports.generateTryOn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Check rate limit
    const rateLimit = await UserTryOn.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 60000)} minutes.`,
        data: rateLimit
      });
    }

    // Get user's stored photo
    const userTryOn = await UserTryOn.findOne({ userId });
    if (!userTryOn?.userPhoto?.imageId) {
      return res.status(400).json({ success: false, message: 'No user photo found. Please upload your photo first.' });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get product image
    const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
    if (!primaryImage) {
      return res.status(400).json({ success: false, message: 'Product has no images' });
    }

    // Fetch images from database
    const userImageDoc = await Image.findById(userTryOn.userPhoto.imageId);
    const productImageDoc = await Image.findById(primaryImage.imageId || primaryImage._id);

    if (!userImageDoc || !productImageDoc) {
      return res.status(400).json({ success: false, message: 'Required images not found' });
    }

    // Call Gemini API for try-on generation
    const generatedImageBuffer = await callGeminiTryOnAPI(userImageDoc, productImageDoc);

    if (!generatedImageBuffer) {
      return res.status(500).json({ success: false, message: 'Failed to generate try-on image' });
    }

    // Store generated image
    const generatedImageDoc = new Image({
      filename: `tryon-${userId}-${productId}.jpg`,
      mimeType: 'image/jpeg',
      data: generatedImageBuffer,
      uploadedBy: userId
    });
    await generatedImageDoc.save();

    const generatedUrl = `/api/images/${generatedImageDoc._id}`;

    // Update UserTryOn with generated image
    await UserTryOn.findOneAndUpdate(
      { userId },
      {
        $push: {
          generatedImages: {
            productId,
            imageId: generatedImageDoc._id,
            url: generatedUrl,
            generatedAt: new Date()
          }
        }
      },
      { upsert: true }
    );

    // Increment generation count
    await UserTryOn.incrementGeneration(userId);

    res.json({
      success: true,
      message: 'Try-on generated successfully',
      data: {
        generatedImageUrl: generatedUrl,
        remainingGenerations: rateLimit.remaining - 1
      }
    });
  } catch (error) {
    console.error('Generate try-on error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate try-on' });
  }
};

// Generate try-ons for first 10 products
exports.generateForFirstTenProducts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check rate limit
    const rateLimit = await UserTryOn.checkRateLimit(userId);
    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit.resetAt - Date.now()) / 60000)} minutes.`,
        data: rateLimit
      });
    }

    // Get user's stored photo
    const userTryOn = await UserTryOn.findOne({ userId });
    if (!userTryOn?.userPhoto?.imageId) {
      return res.status(400).json({ success: false, message: 'No user photo found. Please upload your photo first.' });
    }

    // Get first 10 products
    const products = await Product.find().limit(10).select('name images');

    const results = [];
    const remainingAllowed = Math.min(rateLimit.remaining, 10);

    for (let i = 0; i < remainingAllowed && i < products.length; i++) {
      try {
        const product = products[i];
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        if (!primaryImage) continue;

        // Check if already generated
        const existing = userTryOn.generatedImages?.find(g => g.productId.toString() === product._id.toString());
        if (existing) {
          results.push({ productId: product._id, status: 'already_exists', url: existing.url });
          continue;
        }

        // Fetch images
        const userImageDoc = await Image.findById(userTryOn.userPhoto.imageId);
        const productImageDoc = await Image.findById(primaryImage.imageId || primaryImage._id);
        if (!userImageDoc || !productImageDoc) continue;

        // Generate
        const generatedBuffer = await callGeminiTryOnAPI(userImageDoc, productImageDoc);
        if (!generatedBuffer) continue;

        // Store
        const generatedImageDoc = new Image({
          filename: `tryon-${userId}-${product._id}.jpg`,
          mimeType: 'image/jpeg',
          data: generatedBuffer,
          uploadedBy: userId
        });
        await generatedImageDoc.save();

        const generatedUrl = `/api/images/${generatedImageDoc._id}`;

        await UserTryOn.findOneAndUpdate(
          { userId },
          {
            $push: {
              generatedImages: {
                productId: product._id,
                imageId: generatedImageDoc._id,
                url: generatedUrl,
                generatedAt: new Date()
              }
            }
          }
        );

        await UserTryOn.incrementGeneration(userId);
        results.push({ productId: product._id, status: 'generated', url: generatedUrl });
      } catch (err) {
        console.error(`Failed to generate for product ${products[i]?._id}:`, err);
        results.push({ productId: products[i]?._id, status: 'failed', error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Generated try-ons for ${results.filter(r => r.status === 'generated').length} products`,
      data: { results, totalProcessed: results.length }
    });
  } catch (error) {
    console.error('Generate for first ten error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate try-ons' });
  }
};

// Helper function to call Gemini API
async function callGeminiTryOnAPI(userImageDoc, productImageDoc) {
  try {
    const userImageBuffer = userImageDoc.data?.buffer || userImageDoc.data;
    const productImageBuffer = productImageDoc.data?.buffer || productImageDoc.data;

    if (!userImageBuffer || !productImageBuffer) {
      throw new Error('Invalid image data');
    }

    // Convert to base64
    const userImageBase64 = Buffer.isBuffer(userImageBuffer) 
      ? userImageBuffer.toString('base64')
      : Buffer.from(userImageBuffer).toString('base64');
    const productImageBase64 = Buffer.isBuffer(productImageBuffer)
      ? productImageBuffer.toString('base64')
      : Buffer.from(productImageBuffer).toString('base64');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [
            {
              text: `You are an expert virtual try-on AI assistant.

Task: Generate a highly realistic image of the person from the first image wearing the product shown in the second image.

Strict Guidelines:
- Identity Preservation: You must strictly preserve the user's face, hair, skin tone, and body shape. Do not alter their identity.
- Product Application: Replace the user's current outfit with the new product. Ensure realistic fabric folds, draping, and fit based on the user's pose.
- Lighting & Integration: Match the lighting, shadows, and color temperature of the product to the user's original environment so it looks like a single photograph, not a photoshop cut-out.
- Output: Return only the final image.`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: userImageBase64
              }
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: productImageBase64
              }
            }
          ]
        }],
        generation_config: {
          temperature: 0.4,
          response_modalities: ['Text', 'Image']
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000
      }
    );

    // Extract generated image from response
    const candidates = response.data?.candidates;
    if (!candidates || !candidates[0]?.content?.parts) {
      throw new Error('Invalid response from Gemini API');
    }

    for (const part of candidates[0].content.parts) {
      if (part.inline_data?.data) {
        return Buffer.from(part.inline_data.data, 'base64');
      }
    }

    return null;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return null;
  }
}
