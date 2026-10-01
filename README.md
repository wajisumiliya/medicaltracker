# Medical Tracker

The browser application does not receive or bundle the Gemini API key.

## Run locally

```bash
npm install
npm run dev
```

## Secure Gemini backend - Cloudflare Worker

The AI assistant calls an authenticated Cloudflare Worker. The Worker verifies the Firebase login token and only allows the configured verified family-owner Google account.

Deploy it:

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

When Wrangler asks for the secret value, paste the real Gemini API key. It is stored in Cloudflare and is not committed to GitHub or bundled into the frontend.

Default endpoint:

```
https://medicaltracker-ai.mohamedwajeethuali.workers.dev
```

If Cloudflare gives a different Worker URL, set VITE_GEMINI_PROXY_URL in the frontend deployment to that public Worker URL.

Sign in to Family Cloud Sync before using the AI assistant.

The old Firebase Functions folder can be ignored unless the Firebase project is later upgraded to Blaze.
