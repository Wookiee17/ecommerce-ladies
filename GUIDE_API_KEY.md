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

## Deployment (Live Server)

Since `.env` files are ignored by git (for security), you must manually add your secrets to your hosting dashboard.

### If using Render (as configured):
1.  Go to your **Render Dashboard**.
2.  Select your backend service (`evara-backend`).
3.  Click on **Environment**.
4.  Click **Add Environment Variable**.
5.  Key: `GOOGLE_API_KEY`
6.  Value: `AIza...` (your copied key).
7.  Save changes. Render will automatically redeploy your app.

## Troubleshooting
- **Limit Exceeded**: If the feature stops working, check your quote usage in the Google Cloud Console.
- **Image Generation**: If you only get text descriptions, ensure your project has access to `imagen` models or wait for wider rollout of multimodal generation in `gemini-flash`.
