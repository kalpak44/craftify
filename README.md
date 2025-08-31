# Developer Quick Start

This is a Vite-based frontend located in the `frontend/` directory. You can run it in two ways:

## 1) Run from source (Vite dev server)

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

This serves the built app locally (defaults to http://localhost:4173).

## 2) Run with Docker

- WIP

## CI/CD (GitHub Actions)

- Any push to any branch that changes files under `frontend/**` will build and push the Docker image to Docker Hub.
- Image tags pushed by CI:
  - `kalpak44/craftify-app:sha-<shortsha>`
  - `kalpak44/craftify-app:branch-<sanitized-branch>`
  - `kalpak44/craftify-app:latest`
- Make sure repository secrets are set:
  - `DOCKERHUB_USERNAME`
  - `DOCKERHUB_TOKEN` (Docker Hub access token)
