# 11ty Blog

A personal Eleventy blog with long-form posts, notes, link posts, and bookmarks. GitHub Pages is the current publishing target; a DreamHost upload script is available for later.

## What This Repo Contains

- `src/`: site content, layouts, data, assets, and the Eleventy config
- `config/`: Node dependencies and npm scripts
- `scripts/`: deployment helpers
- `_site/`: generated production build output
- `docs/`: extra setup and deployment notes

## Local Setup

This repo now includes a small root-level `package.json` so you can run the common commands from the repo root, while the actual Eleventy dependencies and scripts still live under `config/`.

```bash
# Install dependencies (Eleventy is installed with the project)
npm ci --prefix config

# Start the local preview server
npm run start

# Start the admin UI in a second terminal
npm run admin
```

Eleventy will build the site into `_site/` and serve it locally, usually at `http://localhost:8080`. The admin UI runs separately at `http://localhost:3000`.

## Useful Commands

```bash
# One-off production build
npm run build

# Rebuild on file changes without serving
npm run watch

# Run the deployment script
npm run deploy
```

## Working On Content

- Posts: `src/posts/`
- Notes: `src/notes/`
- Link posts: `src/link-posts/`
- Bookmarks: `src/bookmarks/`
- Main layouts: `src/_includes/layouts/`
- Global metadata: `src/_data/metadata.json`
- CSS: `src/css/`

## Notes From This Review

- The generated site output is `_site/`, not `output/`.
- The Eleventy config file lives at `src/.eleventy.js`.
- The root `package.json` is a lightweight wrapper around the real scripts in `config/package.json`.

## Publish on GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) builds and deploys this site whenever `main` is pushed to the `peroty/11ty-blog` repository. It publishes at `https://peroty.github.io/11ty-blog/` and leaves the older `peroty.github.io` site alone. The workflow adjusts links and assets for the `/11ty-blog/` path. To check that build locally:

```bash
PAGES_BASE_PATH=/11ty-blog SITE_URL=https://peroty.github.io/11ty-blog npm run build:pages
```

In GitHub, set **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. Your local admin saves Markdown and images into `src/`; commit and push those changes to publish them. The admin server is for local use and is excluded from the public site build.

For a later DreamHost move, see [deployment notes](docs/DEPLOYMENT.md). Run `npm run build` for the normal root-path version of the site before uploading it there.
