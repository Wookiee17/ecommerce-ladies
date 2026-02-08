const sharp = require('sharp');
const { Client, handle_file } = require('@gradio/client');

// Helper function to resize image to max 1024px on longest side
async function resizeImage(buffer, mimeType) {
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const maxSize = 1024;
    const { width, height } = metadata;

    // Only resize if image is larger than maxSize
    if (width > maxSize || height > maxSize) {
      const resized = await image
        .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      return { buffer: resized, mimeType: 'image/jpeg' };
    }

    // Convert to JPEG for consistency (handles AVIF and other formats)
    const converted = await image.jpeg({ quality: 85 }).toBuffer();
    return { buffer: converted, mimeType: 'image/jpeg' };
  } catch (err) {
    console.error('Image resize error:', err.message);
    return { buffer, mimeType };
  }
}

// Helper function to call IDM-VTON with retry logic
async function callIDMVTONWithRetry(client, params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`IDM-VTON attempt ${attempt}/${maxRetries}...`);
      const result = await client.predict("/tryon", params);
      return result;
    } catch (error) {
      const isGPUError = error.message?.includes('GPU') || error.message?.includes('gpu');
      const isQueueError = error.message?.includes('queue') || error.message?.includes('Queue');

      if ((isGPUError || isQueueError) && attempt < maxRetries) {
        const waitTime = 30 * attempt; // 30s, 60s, 90s
        console.log(`GPU not available. Waiting ${waitTime} seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
        continue;
      }
      throw error;
    }
  }
}

exports.generate = async (req, res) => {
  try {
    // Validate User Image (Must be a file)
    if (!req.files || !req.files.userImage) {
      return res.status(400).json({ success: false, message: 'User image is required (file upload).' });
    }
    const userImage = req.files.userImage[0];

    // Handle Product Image (File OR URL)
    let productImageBuffer;
    let productImageMimeType;

    if (req.files && req.files.productImage) {
      const img = req.files.productImage[0];
      productImageBuffer = img.buffer;
      productImageMimeType = img.mimetype;
    } else if (req.body.productImage && typeof req.body.productImage === 'string') {
      try {
        let imageUrl = req.body.productImage;

        if (imageUrl.startsWith('/')) {
          const protocol = req.protocol || 'http';
          const host = req.get('host') || `localhost:${process.env.PORT || 5000}`;
          imageUrl = `${protocol}://${host}${imageUrl}`;
        }

        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error(`Failed to fetch product image from URL: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        productImageBuffer = Buffer.from(arrayBuffer);
        productImageMimeType = response.headers.get('content-type') || 'image/jpeg';
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Failed to process product image URL.', error: err.message });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Product image is required (file upload or URL).' });
    }

    // Resize images
    console.log('Resizing images...');
    const resizedUserImage = await resizeImage(userImage.buffer, userImage.mimetype);
    const resizedProductImage = await resizeImage(productImageBuffer, productImageMimeType);

    // Connect to Hugging Face IDM-VTON Space
    console.log('Connecting to Hugging Face IDM-VTON...');
    const hfToken = process.env.HF_TOKEN;
    console.log('HF Token configured:', hfToken ? 'Yes (starts with ' + hfToken.substring(0, 10) + '...)' : 'No');

    // Pass token for ZeroGPU quota - parameter name is 'token' in Gradio client
    const client = await Client.connect("yisol/IDM-VTON", {
      token: hfToken
    });

    // Create Blobs from buffers
    const userImageBlob = new Blob([resizedUserImage.buffer], { type: resizedUserImage.mimeType });
    const productImageBlob = new Blob([resizedProductImage.buffer], { type: resizedProductImage.mimeType });

    console.log('Calling IDM-VTON API with retry...');

    // Call IDM-VTON with retry logic
    const description = req.body.description || "A stylish garment for virtual try-on";
    console.log('Using description:', description);

    const params = [
      {
        "background": handle_file(userImageBlob),
        "layers": [],
        "composite": null
      },
      handle_file(productImageBlob),
      description,
      true,
      false,
      30,
      42
    ];

    const result = await callIDMVTONWithRetry(client, params, 3);

    console.log('IDM-VTON result received');

    // Extract the result image
    if (result && result.data) {
      const outputData = result.data[0];

      if (outputData) {
        let imageUrl = null;

        if (typeof outputData === 'string') {
          imageUrl = outputData;
        } else if (outputData.url) {
          imageUrl = outputData.url;
        } else if (outputData.path) {
          imageUrl = outputData.path;
        }

        if (imageUrl) {
          console.log('Fetching result image...');
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch result image: ${imageResponse.status}`);
          }
          const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
          const contentType = imageResponse.headers.get('content-type') || 'image/png';

          res.set('Content-Type', contentType);
          res.set('Content-Length', imageBuffer.length);
          return res.send(imageBuffer);
        }

        if (outputData.data) {
          const imageBuffer = Buffer.from(outputData.data, 'base64');
          res.set('Content-Type', outputData.mime_type || 'image/png');
          res.set('Content-Length', imageBuffer.length);
          return res.send(imageBuffer);
        }
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to generate try-on image',
      debug: result ? JSON.stringify(result.data).substring(0, 500) : 'No result'
    });

  } catch (error) {
    console.error('Virtual Try-On Error:', error.message);

    // User-friendly error messages
    if (error.message?.includes('GPU') || error.message?.includes('gpu')) {
      return res.status(503).json({
        success: false,
        message: 'The AI server is currently busy. Our virtual try-on uses free GPU resources which may be limited. Please try again in 1-2 minutes.',
        retryAfter: 60,
        errorType: 'GPU_UNAVAILABLE'
      });
    }

    if (error.message?.includes('queue') || error.message?.includes('Queue')) {
      return res.status(503).json({
        success: false,
        message: 'There are many users trying on clothes right now! Please wait a moment and try again.',
        retryAfter: 30,
        errorType: 'QUEUE_FULL'
      });
    }

    if (error.message?.includes('Could not connect')) {
      return res.status(503).json({
        success: false,
        message: 'The AI service is starting up. Please try again in 30 seconds.',
        retryAfter: 30,
        errorType: 'SERVICE_STARTING'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process virtual try-on. Please try again.',
      error: error.message
    });
  }
};
