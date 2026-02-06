const axios = require('axios');
const FormData = require('form-data');

exports.generate = async (req, res) => {
  try {
    const { prompt, temperature } = req.body;
    const userImage = req.files.userImage[0];
    const productImage = req.files.productImage[0];

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('temperature', temperature);
    formData.append('userImage', userImage.buffer, userImage.originalname);
    formData.append('productImage', productImage.buffer, productImage.originalname);

    const bananaApiKey = process.env.BANANA_API_KEY;
    if (!bananaApiKey) {
      return res.status(500).json({ message: 'Banana API key not configured.' });
    }

    const response = await axios.post('https://api.banana.dev/v1/images/generations', formData, {
      headers: {
        ...formData.getHeaders(),
        'X-Banana-API-Key': bananaApiKey,
      },
      responseType: 'arraybuffer',
    });

    res.setHeader('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    console.error('Error generating virtual try-on image:', error);
    res.status(500).json({ message: 'Failed to generate virtual try-on image' });
  }
};
