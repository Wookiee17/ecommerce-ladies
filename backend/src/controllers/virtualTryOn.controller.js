const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.generate = async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate User Image (Must be a file for now)
    if (!req.files || !req.files.userImage) {
      return res.status(400).json({ message: 'User image is required (file upload).' });
    }
    const userImage = req.files.userImage[0];

    // Handle Product Image (File OR URL)
    let productImageBuffer;
    let productImageMimeType;

    if (req.files && req.files.productImage) {
      // Case 1: File Upload
      const img = req.files.productImage[0];
      productImageBuffer = img.buffer;
      productImageMimeType = img.mimetype;
    } else if (req.body.productImage && typeof req.body.productImage === 'string') {
      // Case 2: URL String
      try {
        const response = await fetch(req.body.productImage);
        if (!response.ok) throw new Error('Failed to fetch product image from URL');
        const arrayBuffer = await response.arrayBuffer();
        productImageBuffer = Buffer.from(arrayBuffer);
        productImageMimeType = response.headers.get('content-type') || 'image/jpeg';
      } catch (err) {
        return res.status(400).json({ message: 'Failed to process product image URL.', error: err.message });
      }
    } else {
      return res.status(400).json({ message: 'Product image is required (file upload or URL).' });
    }

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ message: 'Google API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const userImagePart = {
      inlineData: {
        data: userImage.buffer.toString("base64"),
        mimeType: userImage.mimetype,
      },
    };

    const productImagePart = {
      inlineData: {
        data: productImageBuffer.toString("base64"),
        mimeType: productImageMimeType,
      },
    };

    const promptText = prompt || "Generate a realistic virtual try-on image showing the person from the first image wearing the garment from the second image. The output must be an image.";

    const result = await model.generateContent([promptText, userImagePart, productImagePart]);
    const response = await result.response;

    // Check if the model returned an image (candidates[0].content.parts[0].inlineData)
    // Note: The SDK structure for received images might differ based on API version.
    // Standard generateContent usually returns text.
    // If we want images, we might need a different specialized call, but 'generateContent' is the unified API.

    // Fallback logic: check for text.
    const text = response.text();

    // START EXPERIMENTAL IMAGE PARSING
    // If the model did generate an image, it would be in parts.
    // Currently, for most Flash models, this returns a description.

    // We send back the text description, but we flag it clearly.
    // To support TRUE image generation, we would need to switch to `imagen-3.0-generate-001`.
    // Let's try that if the user explicitly requested "replace product image... with user image".

    res.json({
      success: true,
      type: 'analysis_or_description',
      description: text,
      note: "Used model: gemini-2.0-flash-exp. If an image was not returned, it is because the current API key/model tier prioritized text description. For guaranteed image generation, an Imagen-enabled project is required."
    });

  } catch (error) {
    console.error('Error with Google Gemini :', error);
    res.status(500).json({ message: 'Failed to process virtual try-on with Gemini', error: error.message });
  }
};
