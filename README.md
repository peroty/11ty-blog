# 11ty Blog

A personal Eleventy blog with posts, notes, quotes, bookmarks, links, and Markdown pages. GitHub Pages is the current publishing target; a DreamHost upload script is available for later.

## What This Repo Contains

- `src/`: site content, layouts, data, assets, and the Eleventy config
- `config/`: Node dependencies and npm scripts
- `scripts/`: deployment helpers
- `_site/`: generated production build output
- `docs/`: extra setup and deployment notes

## Local Setup

Eleventy and the local editor use project dependencies in `config/`. Install them once, then use [just](https://github.com/casey/just#installation) from the repository root:

```bash
npm ci --prefix config
just serve
```

Open the editor at `http://127.0.0.1:3000` and the live site preview at `http://127.0.0.1:8080`. `just serve` starts both; press Ctrl+C to stop them. If you do not have `just` yet, `npm run start` and `npm run admin` work in separate terminals.

The editor saves Markdown and uploaded images under `src/`. It can create Posts, Notes, Quotes, Bookmarks, Pages, and the older Link Posts. Use **Save Draft** to keep an entry out of the generated site, **Publish** to include it in the local build, and **Deploy** when you want to push published content to GitHub Pages. The preview and metadata controls sit behind **Details & preview** so the Markdown writing area stays visible.

## Useful Commands

```bash
# One-off production build
npm run build

# Rebuild on file changes without serving
npm run watch

# Test, build, commit content changes, and push main to GitHub Pages
just deploy

# Check the Pages build without committing or pushing
DRY_RUN=1 just deploy
```

## Working On Content

- Posts: `src/posts/`
- Notes: `src/notes/`
- Link posts: `src/link-posts/`
- Bookmarks: `src/bookmarks/`
- Quotes: `src/quotes/`
- Pages: `src/pages/` (including About)
- Main layouts: `src/_includes/layouts/`
- Global metadata: `src/_data/metadata.json`
- CSS: `src/css/`

## Publish on GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) builds and deploys this site whenever `main` is pushed to `peroty/11ty-blog`. It publishes at `https://peroty.github.io/11ty-blog/`. `just deploy` runs the editor tests and a Pages build into `_site-pages/`, commits changes in the content and image directories, and pushes `main`. It stops if code or configuration changes are uncommitted, so those can be reviewed separately. Draft Markdown files may be committed to the source repository, but Eleventy excludes them from the public site.

To check the GitHub Pages build manually:

```bash
PAGES_BASE_PATH=/11ty-blog SITE_URL=https://peroty.github.io/11ty-blog npm run build:pages
```

The editor server binds to localhost and is excluded from the public build.

For a later DreamHost move, see [deployment notes](docs/DEPLOYMENT.md). Its upload command is `npm run deploy:dreamhost`.
