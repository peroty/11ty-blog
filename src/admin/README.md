# Local blog editor

The editor is a localhost-only writing desk for the Eleventy site. Start it with `just serve` from the repo root, then open `http://127.0.0.1:3000`. The site preview runs at `http://127.0.0.1:8080` in the same command.

The library can create and edit Posts, Notes, Quotes, Bookmarks, Pages, and Link Posts. It writes Markdown with YAML frontmatter into the corresponding `src/` directory. About is managed as a Page in `src/pages/about.md`. Uploaded images go to `src/images/`; the Images tab can rename them and insert Markdown image links. Renaming an image updates references in Markdown entries. The editor keeps unsaved changes in browser storage for recovery.

**Save Draft** writes Markdown into `.local-drafts/` at the repository root. That folder is Git-ignored and outside Eleventy's input. Saving a draft of a published entry creates a private working copy; the published version remains unchanged. The library displays that working copy until you publish or discard it. Deleting a private revision restores the published entry in the library. Ctrl/Cmd+S always saves a private draft. Back up `.local-drafts/` with your local files; Git does not back it up.

**Publish** writes the finished entry into its normal `src/` folder and rebuilds the local site before reporting success. New image uploads stay in `.local-drafts/images/` until a published entry references them with `/images/filename` Markdown or the image shortcode. Unused uploads remain private. Images already in `src/images/` are public assets; this change does not retroactively make them private.

Legacy `draft: true` entries in `src/` move into private storage when the editor starts or reads them. Conflicting copies stop migration rather than overwrite writing. Already committed drafts remain in Git history even after their current files are removed.

**View Site** opens the current published entry. **Deploy** runs the same script as `just deploy`: checks public content, tests, builds the Pages version, commits content and published image changes, and pushes `main`. The checks reject draft-marked public entries and tracked private storage; the staged content is checked again before commit. Uncommitted code or configuration changes stop deployment until they are reviewed and committed separately. `DRY_RUN=1 just deploy` checks the build without committing or pushing. Local rebuilds preserve `_site` because the live preview server shares it; deployment uses a separate clean output directory.

For iPhone links and quotes, see [Drafts setup](../../tools/drafts/README.md). Unfinished phone writing stays in Drafts. After a phone publication, pull the remote changes before editing or deploying locally.

The API is served only on `127.0.0.1:3000`. Entry endpoints follow `/api/:type` and `/api/:type/:filename`, where `type` is `posts`, `notes`, `quotes`, `bookmarks`, `pages`, or `links`. Other endpoints are `/api/preview`, `/api/meta/tags`, `/api/meta/site`, `/api/images`, `/api/images/upload`, `PATCH /api/images/:filename`, and `/api/deploy`. The editor and API are excluded from the public Eleventy build.
