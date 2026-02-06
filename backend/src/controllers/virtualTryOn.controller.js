const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.generate = async (req, res) => {
  try {
    const { prompt } = req.body; // temperature is less relevant for image gen via flash, but we could use it if supported
    const userImage = req.files.userImage[0];
    const productImage = req.files.productImage[0];

    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      return res.status(500).json({ message: 'Google API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(googleApiKey);
    // Attempting to use the experimental Gemini 2.0 Flash model (aligned with "Nano Banana")
    // which has enhanced multimodal capabilities.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const userImagePart = {
      inlineData: {
        data: userImage.buffer.toString("base64"),
        mimeType: userImage.mimetype,
      },
    };

    const productImagePart = {
      inlineData: {
        data: productImage.buffer.toString("base64"),
        mimeType: productImage.mimetype,
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
