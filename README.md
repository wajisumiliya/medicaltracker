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


## Deploy frontend to Cloudflare Pages (replacing Netlify)

1. In Cloudflare dashboard, open **Workers & Pages → Create → Pages → Connect to Git**.
2. Select GitHub repository **wajisumiliya/medicaltracker**, production branch **main**.
3. Framework preset: **Vite**; build command: `npm run build`; output directory: `dist`; root directory: `/`.
4. Use Node.js 22 (set environment variable `NODE_VERSION=22` if required by the build environment).
5. Optional: configure `VITE_GEMINI_PROXY_URL` to the actual deployed Cloudflare AI Worker URL; the current frontend default is `https://medicaltracker-ai.islamicquiz.workers.dev`. Verify your Worker URL in Cloudflare first.
6. Deploy and test login, family profile switching, medical records, cloud sync, AI advice, Islamic quiz, and PWA installation.
7. In Firebase Console → Authentication → Settings → Authorized domains, add the actual `<project>.pages.dev` hostname and any custom domain used for the frontend. Do not remove the old Netlify hostname until migration is verified.
8. After testing the new Cloudflare site, update your custom domain DNS and only then retire Netlify.

Cloudflare Pages serves the frontend only. **Do not move or delete Firebase Firestore data or authentication settings.** The existing Cloudflare AI Worker is deployed separately from Pages. SPA navigation fallback is configured in `public/_redirects`; cache headers are in `public/_headers`.

### AI Worker note

The active Worker in `worker/src/index.js` uses the Cloudflare Workers AI binding `AI` configured in `worker/wrangler.toml`, not a Gemini API key. Deploy with `cd worker && npm install && npm run deploy` after connecting the Cloudflare account; verify access permissions and Worker endpoint before switching frontend traffic.
