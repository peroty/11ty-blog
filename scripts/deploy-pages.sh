#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [[ $(git branch --show-current) != main ]]; then
  echo "Deploy from the main branch." >&2
  exit 1
fi

remote_url=$(git remote get-url origin)
if [[ ! $remote_url =~ github\.com[:/]peroty/11ty-blog(\.git)?$ ]]; then
  echo "Origin is not peroty/11ty-blog: $remote_url" >&2
  exit 1
fi

# The editor owns content files. Require code and configuration changes to be
# reviewed and committed separately before publishing.
other_changes=$(git status --porcelain --untracked-files=all -- . \
  ':(exclude)src/posts/**' \
  ':(exclude)src/notes/**' \
  ':(exclude)src/link-posts/**' \
  ':(exclude)src/bookmarks/**' \
  ':(exclude)src/quotes/**' \
  ':(exclude)src/pages/**' \
  ':(exclude)src/images/**')
if [[ -n $other_changes ]]; then
  echo "Commit or discard non-content changes before deploying:" >&2
  echo "$other_changes" >&2
  exit 1
fi

node scripts/check-public-content.js --worktree
npm run test:admin
SITE_OUTPUT_DIR=../_site-pages PAGES_BASE_PATH=/11ty-blog SITE_URL=https://peroty.github.io/11ty-blog npm run build:pages

if [[ ${DRY_RUN:-0} == 1 ]]; then
  echo "Dry run passed. No content was committed or pushed."
  exit 0
fi

git fetch origin main
if ! git merge-base --is-ancestor origin/main HEAD; then
  echo "Local main is behind or diverged from origin/main. Update it before deploying." >&2
  exit 1
fi

git add -A -- src/posts src/notes src/link-posts src/bookmarks src/quotes src/pages src/images
node scripts/check-public-content.js
if ! git diff --cached --quiet; then
  git commit -m "Publish blog content"
fi

git push origin main
echo "Pushed to GitHub. Watch https://github.com/peroty/11ty-blog/actions for the Pages deployment."
