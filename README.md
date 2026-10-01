<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1cQ4Ocmco9z7T6xIqYkpxYvGLSc0h9RYf

## Run locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The browser application no longer receives or bundles the Gemini API key.

## Secure Gemini backend

Gemini requests are proxied through the Firebase Function `geminiProxy`. The function requires a valid Firebase ID token for the verified family-owner Google account before it will call Gemini.

Install the Firebase CLI and sign in, then set the Gemini key in Google Secret Manager:

```bash
npm install -g firebase-tools
firebase login
firebase use medicaltracker-family-2026
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted, paste the Gemini API key. Do not put it in this repository or in a frontend `.env` file.

Deploy the secure function:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions:geminiProxy
```

After deployment, sign in to **Family Cloud Sync** inside the tracker before using the AI assistant. Daily fallback guidance remains available when cloud sign-in or the AI service is unavailable.
