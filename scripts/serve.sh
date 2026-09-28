#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ ! -x config/node_modules/.bin/eleventy ]]; then
  echo "Install project dependencies first: npm ci --prefix config" >&2
  exit 1
fi

site_pid=
editor_pid=
cleanup() {
  [[ -z $site_pid ]] || kill "$site_pid" 2>/dev/null || true
  [[ -z $editor_pid ]] || kill "$editor_pid" 2>/dev/null || true
  [[ -z $site_pid ]] || wait "$site_pid" 2>/dev/null || true
  [[ -z $editor_pid ]] || wait "$editor_pid" 2>/dev/null || true
}
trap cleanup EXIT

npm run start &
site_pid=$!
npm run admin &
editor_pid=$!

echo "Editor: http://127.0.0.1:${PORT:-3000}"
echo "Site:   http://127.0.0.1:${SITE_PORT:-8080}"
echo "Press Ctrl+C to stop both servers."
wait -n "$site_pid" "$editor_pid"
