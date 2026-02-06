# How to Generate Google Gemini API Key

This project uses Google's Gemini models ("Nano Banana") for Virtual Try-On features.

## Steps

1.  **Go to Google AI Studio**:
    Visit [https://aistudio.google.com/](https://aistudio.google.com/) and sign in with your Google account.

2.  **Get API Key**:
    - Click on the **"Get API key"** button in the top left or "Create API key" in the dashboard.
    - Choose "Create API key in new project" (or select an existing one).
    - Copy the generated key string (starts with `AIza...`).

3.  **Configure Backend**:
    - Open `backend/.env` file.
    - Paste your key into the `GOOGLE_API_KEY` variable:
      ```env
      GOOGLE_API_KEY=AIzaSyCMhBOuSGD_...
      ```
    - Restart your backend server (`npm run dev`).

## Troubleshooting
- **Limit Exceeded**: If the feature stops working, check your quote usage in the Google Cloud Console.
- **Image Generation**: If you only get text descriptions, ensure your project has access to `imagen` models or wait for wider rollout of multimodal generation in `gemini-flash`.
