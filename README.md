<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bfde85ab-591f-492a-8371-a56ccddf49d4

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the API key in [.env.local](.env.local) to your preferred model's API key (remove or replace any provider-specific references).
3. Run the app:
   `npm run dev`

Deploy (GitHub Pages — frontend only)

This repository includes a GitHub Actions workflow that builds the frontend and publishes the `dist` directory to the `gh-pages` branch when changes are pushed to the `main` branch: .github/workflows/deploy-gh-pages.yml

No repository secrets are required; the workflow uses the automatically-provided `GITHUB_TOKEN` to publish.

How to use:
1. Ensure the site builds locally: `npm run build` (Vite outputs static files into `dist`).
2. Push to `main` — the action will build and publish the contents of `dist` to the `gh-pages` branch.
3. In the repository Settings → Pages, configure GitHub Pages to serve from the `gh-pages` branch (root). After publishing, your site will be available at https://<owner>.github.io/<repo>/ (or your configured custom domain).

Google Apps Script (GAS) Backend Setup (required to enable spreadsheet/drive sync)

1. Prepare the Spreadsheet
   - Create (or open) the Google Spreadsheet that will act as the application's database. The script expects sheets named: `Config`, `EbookData`, `PhysicalBookData`, `VisitorLogs`, and `BorrowLogs`. The Apps Script will create them automatically if missing.

2. Paste the backend Code.gs
   - Open the spreadsheet and go to Extensions → Apps Script.
   - Remove any existing content in Code.gs and paste the canonical backend script.
   - The canonical Code.gs is available in this repository at `apps-script/Code.gs`, and also directly in the running frontend Admin panel: Admin → Setup Instructions → "Salin Kode Sumber Code.gs" (use the "Salin Kode" button to copy).

3. Deploy as Web App
   - Save the script, then Deploy → New deployment.
   - Choose type: Web app.
   - Set "Execute as": Me (your account)
   - Set "Who has access": Anyone
   - Complete the OAuth/authorization flow (approve Drive & Sheets scopes).
   - After deployment copy the Web app URL (the URL that ends with `/exec`).

4. Wire the frontend to the GAS URL
   - Option A (recommended, single global update): Edit `src/defaultConfig.ts` in this repository and set `DEFAULT_GAS_CONFIG.gasUrl` to the Web App `/exec` URL. If needed, also set `ebookFolderId`, `coverFolderId` and `sheetId` there. Then `npm run build` and push to `main` to trigger the automatic GitHub Pages deploy so every visitor receives the same baked-in config.
   - Option B (manual / advanced): If your deployed frontend version provides an admin field for the GAS URL, paste the `/exec` URL there. Note: many versions bake the GAS URL into the build, so Option A ensures consistent global rollout.

5. Verify
   - Open the live site and check the browser devtools Network tab. Requests to the GAS endpoint should respond (responses are base64-encoded JSON — the frontend decodes them). Also check that the `Config` sheet is populated on first run (the frontend writes defaults if the sheet is empty).

Where to find the Code.gs content
   - In-repo canonical file: `apps-script/Code.gs` (recommended source of truth).
   - In the running app Admin: Setup Instructions → "Salin Kode Sumber Code.gs".

Notes & security
   - The Apps Script must be deployed by the owner of the Google account that has access to the spreadsheet and drive.
   - The frontend currently bakes the GAS URL and some IDs into `src/defaultConfig.ts`. This means the URL and IDs are public in the built JS — do not place sensitive credentials there.
   - If you need to protect write operations, add a simple token check inside Code.gs or restrict which actions are allowed for anonymous callers.

CI / Auto-deploy to GitHub Pages

- The workflow `.github/workflows/deploy-gh-pages.yml` builds and publishes `dist` to the `gh-pages` branch when commits are merged into `main`.
- To trigger an automatic build & deploy for the changes in this branch, merge the pull request into `main`. If you'd like, I can create the PR and merge it (triggering the workflow) — which I will do next unless you prefer to review first.

Notes:
- Do NOT commit any sensitive keys to the repository.
- If the build directory is different, update `publish_dir` in the workflow file.
