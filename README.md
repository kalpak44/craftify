# Developer Quick Start

This is a Vite-based frontend located in the `frontend/` directory. You can run it in two ways:

## Run from source (Vite dev server)

Prerequisites:
- Node.js 20+ (LTS recommended)
- npm (bundled with Node)

Steps:
- cd frontend
- npm install
- npm run dev

Open http://localhost:5173 in your browser (default Vite port). The dev server hot‑reloads on file changes.

Production-like local test (no Docker):
- npm run build
- npm run preview

This serves the built app locally (defaults to http://localhost:5173).

## Environment configuration

For local development, the app reads environment variables from `frontend/.env.development`.
Create or verify this file with the following content:

```
VITE_AUTH0_DOMAIN=dev-f5ge1-8v.us.auth0.com
VITE_AUTH0_CLIENT_ID=wUzgSsPGxVXW2g9rDKG9UUmYRRh7Oo6P
VITE_AUTH0_REDIRECT_URL=http://localhost:5173/callback
VITE_AUTH0_AUDIENCE=https://app.craftify.com/
VITE_API_HOST=http://localhost:8080
VITE_APP_ROOT_PATH=/
```

Notes:
- These variables are used by the Vite dev server (`npm run dev`) and should match your local services and Auth0 application allowed callback URLs.
- For production (GitHub Pages), variables live in `frontend/.env.production`. The redirect URL there is set to `https://my-domain.com/callback` and must also be allowed in your Auth0 app settings.

## CI/CD (GitHub Pages)

This repository deploys the frontend to GitHub Pages.

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: push to `main` or `master`, or manual dispatch
- Build directory: `frontend/`
- Output: `frontend/dist` uploaded to Pages
- Live URL: https://kalpak44.github.io/craftify/