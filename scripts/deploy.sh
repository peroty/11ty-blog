#!/bin/bash

# Simple deployment script for 11ty blog to Dreamhost
# Works on macOS and Linux

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "🏗️  Building site..."
npm run build --prefix config

echo ""
echo "📦 Reading deployment configuration..."

# Read config from deploy-config.json
HOST=$(node -pe "require('./config/deploy-config.json').host")
USERNAME=$(node -pe "require('./config/deploy-config.json').username")
REMOTE_PATH=$(node -pe "require('./config/deploy-config.json').remotePath")
LOCAL_PATH=$(node -pe "require('./config/deploy-config.json').localPath")

echo "📤 Deploying to $USERNAME@$HOST:$REMOTE_PATH"
echo ""

# Use rsync to upload files
# -a: archive mode (preserves permissions, timestamps, etc.)
# -v: verbose
# -z: compress during transfer
# --delete: remove files on server that don't exist locally
# --exclude: don't upload these files

rsync -avz --delete \
  --exclude '.DS_Store' \
  --exclude '.git' \
  --exclude 'node_modules' \
  "$LOCAL_PATH" "$USERNAME@$HOST:$REMOTE_PATH"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site should now be live"
