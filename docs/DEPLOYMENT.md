# Deployment Guide

GitHub Pages is the current publishing target; see the root README. This guide covers a later move to DreamHost or another SSH host using the existing upload script.

## How It Works

1. **Build**: 11ty generates your static site into the `_site/` folder
2. **Upload**: The script uses `rsync` to upload files to your Dreamhost server via SSH/SFTP
3. **Done**: Your site is live!

## One-Time Setup

### Step 1: Set Up SSH Key Authentication (Recommended)

This allows you to deploy without typing your password every time.

**On your Mac or Linux machine:**

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy your public key to Dreamhost
ssh-copy-id your-username@your-domain.dreamhosters.com
```

**Test the connection:**

```bash
ssh your-username@your-domain.dreamhosters.com
```

If you can log in without a password, you're all set!

### Step 2: Configure Your Deployment Settings

1. Copy the example config file:
   ```bash
   cp config/deploy-config.example.json config/deploy-config.json
   ```

2. Edit `config/deploy-config.json` with your DreamHost details:
   ```json
   {
     "host": "your-domain.dreamhosters.com",
     "username": "your-dreamhost-username",
     "remotePath": "/home/your-username/your-domain.com/",
     "localPath": "_site/"
   }
   ```

**Finding your Dreamhost details:**
- **host**: Usually `yourdomain.dreamhosters.com` (check Dreamhost panel)
- **username**: Your Dreamhost shell username (not your panel login)
- **remotePath**: The full path to your website directory on Dreamhost
  - Usually `/home/username/yourdomain.com/`
  - You can find this by SSHing into Dreamhost and running `pwd` in your web directory

### Step 3: Make the Deploy Script Executable

```bash
chmod +x scripts/deploy.sh
```

## Deploying Your Site

Every time you want to publish changes:

```bash
npm run deploy:dreamhost
```

That's it! The script will:
1. Build your site (`npm run build`)
2. Upload everything in `_site/` to your Dreamhost server
3. Delete any files on the server that you've removed locally

## What Gets Uploaded

The script uploads your entire `_site/` folder, which contains:
- All HTML pages
- CSS files
- Images
- Any other assets

It automatically excludes:
- `.DS_Store` files (macOS)
- `.git` folder
- `node_modules`

## Workflow Example

Here's a typical workflow:

```bash
# 1. Write a new post
# Create src/posts/my-new-post.md

# 2. Preview locally
npm start
# Visit http://localhost:8080

# 3. When happy, deploy
npm run deploy:dreamhost
```

## Understanding the Build Process

When you run `npm run build`, 11ty:
1. Reads all files in `src/`
2. Processes templates (`.njk`, `.md`)
3. Applies layouts from `_includes/layouts/`
4. Generates static HTML files in `_site/`
5. Copies CSS, images, and other assets to `_site/`

The `_site/` folder is your complete, ready-to-publish website.

## Troubleshooting

### "Permission denied" error
- Make sure you've set up SSH key authentication (see Step 1)
- Or the script will prompt for your password each time

### "rsync: command not found"
- rsync comes pre-installed on macOS and most Linux distributions
- If missing, install it: `sudo apt install rsync` (Ubuntu) or `brew install rsync` (macOS)

### Files not updating on server
- Check that your `remotePath` in `deploy-config.json` is correct
- SSH into your Dreamhost server and verify the path exists

### Want to test without uploading?
Add the `--dry-run` flag to the rsync command in `scripts/deploy.sh`:
```bash
rsync -avz --delete --dry-run \
  --exclude '.DS_Store' \
  --exclude '.git' \
  --exclude 'node_modules' \
  "$LOCAL_PATH" "$USERNAME@$HOST:$REMOTE_PATH"
```

## Security Notes

- `config/deploy-config.json` is in `.gitignore` to keep your server settings private
- Never commit this file to version control
- If you share your repository, others will need to create their own `deploy-config.json`

## Alternative: Manual Deployment

If you prefer, you can deploy manually:

```bash
# Build the site
npm run build

# Upload using an FTP client like FileZilla or Cyberduck
# Just upload the contents of _site/ to your web directory
```

Or use rsync directly:
```bash
npm run build
rsync -avz --delete _site/ username@host.dreamhosters.com:/path/to/webroot/
```
