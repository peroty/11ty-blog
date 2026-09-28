# Local blog editor

The editor is a localhost-only writing desk for the Eleventy site. Start it with `just serve` from the repo root, then open `http://127.0.0.1:3000`. The site preview runs at `http://127.0.0.1:8080` in the same command.

The library can create and edit Posts, Notes, Quotes, Bookmarks, Pages, and Link Posts. It writes Markdown with YAML frontmatter into the corresponding `src/` directory. About is managed as a Page in `src/pages/about.md`. Uploaded images go to `src/images/`; the Media tab can insert a Markdown image or Eleventy image shortcode. The editor keeps unsaved changes in browser storage for recovery.

**Save Draft** writes an entry with `draft: true`, which Eleventy excludes from the public site. **Publish** removes that flag and updates the local preview. **Deploy** runs the same script as `just deploy`: tests, builds the Pages version, commits content and image changes, and pushes `main`. Uncommitted code or configuration changes stop deployment until they are reviewed and committed separately. `DRY_RUN=1 just deploy` checks the build without committing or pushing.

The API is served only on `127.0.0.1:3000`. Entry endpoints follow `/api/:type` and `/api/:type/:filename`, where `type` is `posts`, `notes`, `quotes`, `bookmarks`, `pages`, or `links`. Other endpoints are `/api/preview`, `/api/meta/tags`, `/api/images`, `/api/images/upload`, and `/api/deploy`. The editor and API are excluded from the public Eleventy build.
