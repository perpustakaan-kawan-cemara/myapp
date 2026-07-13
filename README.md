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

Notes:
- Do NOT commit any sensitive keys to the repository.
- If the build directory is different, update `publish_dir` in the workflow file.
