---
title: "Getting Started with 11ty: A Complete Installation Guide for macOS and Linux"
date: 2026-01-08
tags:
  - 11ty
  - static site generator
  - tutorial
  - web development
description: "A comprehensive guide to installing and setting up Eleventy (11ty) from scratch on macOS and Ubuntu Linux. Perfect for writers and photographers who want a simple, fast static site generator."
layout: layouts/post.njk
---

# Getting Started with 11ty: A Complete Installation Guide

If you're a writer or photographer looking for a simple, fast way to publish content online without the complexity of WordPress or the headaches of GitHub Actions, **Eleventy (11ty)** is an excellent choice. This guide will walk you through installing 11ty from scratch on macOS, with notes for Ubuntu Linux users.

## What is 11ty?

Eleventy is a **static site generator** - it takes your content (written in Markdown, HTML, or other formats) and transforms it into a complete website made of simple HTML files. These files can be uploaded to any web host, including shared hosting like Dreamhost.

**Why 11ty?**
- **Simple**: Write in Markdown, get HTML
- **Fast**: Builds sites in milliseconds
- **Flexible**: Use any template language you prefer
- **No database**: Just files and folders
- **Deploy anywhere**: Upload to any web host via FTP/SFTP

## Prerequisites

Before we begin, you'll need:

### macOS
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- A text editor (VS Code, Sublime Text, etc.)
- Terminal access

### Ubuntu Linux
- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- A text editor
- Terminal access

## Step 1: Install Node.js

11ty runs on Node.js, so we need to install it first.

### On macOS

The easiest way is using **Homebrew** (a package manager for macOS):

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Verify installation
node --version
npm --version
```

You should see version numbers like `v20.x.x` for Node and `10.x.x` for npm.

**Alternative**: Download the installer from [nodejs.org](https://nodejs.org/) and run it.

### On Ubuntu Linux

```bash
# Update package list
sudo apt update

# Install Node.js (latest LTS version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

**Note**: Ubuntu's default `apt` repository often has an outdated version of Node.js. The method above installs the latest LTS (Long Term Support) version directly from NodeSource.

## Step 2: Create Your Blog Project

Now let's create a new folder for your blog and set up the project structure.

```bash
# Create a new directory for your blog
mkdir my-blog
cd my-blog

# Initialize a new npm project
npm init -y
```

This creates a `package.json` file that tracks your project's dependencies.

## Step 3: Install 11ty

Install Eleventy as a development dependency:

```bash
npm install --save-dev @11ty/eleventy
```

This downloads 11ty (currently version 3.1.2 as of January 2026) and adds it to your project.

**Verify the installation:**

```bash
npx @11ty/eleventy --version
```

You should see something like `3.1.2`.

## Step 4: Create Your First Page

Let's create a simple homepage:

```bash
# Create a source directory
mkdir src

# Create an index file
echo "# Hello World\n\nWelcome to my blog!" > src/index.md
```

## Step 5: Configure 11ty

Create a configuration file called `.eleventy.js` in your project root:

```javascript
module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: "src",
      output: "_site"
    }
  };
};
```

This tells 11ty to:
- Read content from the `src/` folder
- Generate the website in the `_site/` folder

## Step 6: Build Your Site

Now let's build your site:

```bash
npx @11ty/eleventy
```

You should see output like:

```
[11ty] Writing ./_site/index.html from ./src/index.md
[11ty] Wrote 1 file in 0.05 seconds
```

Your site is now in the `_site/` folder! Open `_site/index.html` in a browser to see it.

## Step 7: Add Development Scripts

To make life easier, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "start": "npx @11ty/eleventy --serve",
    "build": "npx @11ty/eleventy"
  }
}
```

Now you can:

```bash
# Start a development server with live reload
npm start

# Build for production
npm run build
```

Visit `http://localhost:8080` to see your site with live reloading - any changes you make will automatically refresh the browser!

## Step 8: Install Useful Plugins (Optional)

Here are some commonly used plugins that enhance 11ty:

```bash
# Image optimization
npm install --save @11ty/eleventy-img

# RSS feed generation
npm install --save-dev @11ty/eleventy-plugin-rss

# Date formatting
npm install --save luxon

# Markdown enhancements
npm install --save markdown-it markdown-it-anchor markdown-it-footnote
```

## Project Structure

After following this guide, your project should look like this:

```
my-blog/
├── .eleventy.js          # Configuration file
├── package.json          # Project dependencies
├── node_modules/         # Installed packages (auto-generated)
├── src/                  # Your content
│   └── index.md         # Homepage
└── _site/               # Generated website (auto-generated)
    └── index.html
```

## Next Steps

Now that you have 11ty installed and running:

1. **Create content**: Add more `.md` files in `src/`
2. **Add layouts**: Create reusable templates in `src/_includes/layouts/`
3. **Style your site**: Add CSS files
4. **Deploy**: Upload the `_site/` folder to your web host

## Deploying to Shared Hosting (Dreamhost, etc.)

One of the best things about 11ty is that you can deploy to any web host without complex CI/CD pipelines or GitHub Actions. Here's how to set up a simple, automated deployment script.

### Manual Deployment (Quick Start)

The simplest approach:

1. **Build your site**: `npm run build`
2. **Upload**: Use SFTP/FTP to upload the `_site/` folder to your web host
3. **Done**: Your site is live!

### Automated Deployment with rsync (Recommended)

For a more streamlined workflow, create a deployment script that builds and uploads your site with one command.

#### Step 1: Create a Configuration File

Create `deploy-config.json` in your project root:

```json
{
  "host": "your-domain.dreamhosters.com",
  "username": "your-username",
  "remotePath": "/home/your-username/your-domain.com/",
  "localPath": "_site/"
}
```

**Replace with your actual details:**
- `host`: Your hosting server address (check your hosting panel)
- `username`: Your SSH/SFTP username
- `remotePath`: The full path to your website directory on the server
- `localPath`: Your local build directory (usually `_site/`)

#### Step 2: Create the Deployment Script

Create `deploy.sh` in your project root:

```bash
#!/bin/bash

# Simple deployment script for 11ty blog to shared hosting
# Works on macOS and Linux

set -e

echo "🏗️  Building site..."
npm run build

echo ""
echo "📦 Reading deployment configuration..."

# Read config from deploy-config.json
HOST=$(node -pe "require('./deploy-config.json').host")
USERNAME=$(node -pe "require('./deploy-config.json').username")
REMOTE_PATH=$(node -pe "require('./deploy-config.json').remotePath")
LOCAL_PATH=$(node -pe "require('./deploy-config.json').localPath")

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
```

#### Step 3: Make the Script Executable

```bash
chmod +x deploy.sh
```

#### Step 4: Set Up SSH Key Authentication (One-Time Setup)

This allows you to deploy without typing your password every time:

**On macOS or Linux:**

```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy your public key to your hosting server
ssh-copy-id your-username@your-domain.dreamhosters.com

# Test the connection
ssh your-username@your-domain.dreamhosters.com
```

If you can log in without a password, you're all set!

#### Step 5: Add Deploy Command to package.json

Update your `package.json` scripts section:

```json
{
  "scripts": {
    "start": "npx @11ty/eleventy --serve",
    "build": "npx @11ty/eleventy",
    "deploy": "bash deploy.sh"
  }
}
```

#### Step 6: Deploy Your Site

Now you can deploy with a single command:

```bash
npm run deploy
```

This will:
1. Build your site
2. Read your deployment configuration
3. Upload everything to your web host via rsync
4. Delete any files on the server that you've removed locally

### Security: Keep Your Credentials Private

Add `deploy-config.json` to your `.gitignore` file to keep your credentials private:

```bash
echo "deploy-config.json" >> .gitignore
```

Create a `deploy-config.example.json` file (without real credentials) that you can commit to version control:

```json
{
  "host": "your-domain.dreamhosters.com",
  "username": "your-username",
  "remotePath": "/home/your-username/your-domain.com/",
  "localPath": "_site/"
}
```

### Your Complete Workflow

With this setup, your publishing workflow becomes:

```bash
# 1. Write content in src/posts/
# 2. Preview locally
npm start

# 3. When ready to publish
npm run deploy
```

That's it! No GitHub, no Actions, no complex CI/CD. Just write, build, and upload.

### Troubleshooting Deployment

**"rsync: command not found"**
- rsync comes pre-installed on macOS and most Linux distributions
- On Ubuntu: `sudo apt install rsync`
- On macOS: `brew install rsync` (if needed)

**"Permission denied" errors**
- Make sure you've set up SSH key authentication (Step 4)
- Or the script will prompt for your password each time

**Files not updating on server**
- Verify your `remotePath` is correct
- SSH into your server and check the path: `ssh user@host` then `pwd`

**Want to test without uploading?**
Add `--dry-run` to the rsync command to see what would be uploaded without actually doing it.

## Troubleshooting

### "Command not found: npx"
- Make sure Node.js is installed: `node --version`
- Restart your terminal after installing Node.js

### "Cannot find module '@11ty/eleventy'"
- Run `npm install` in your project directory
- Make sure you're in the correct folder

### Permission errors on Ubuntu
- Don't use `sudo` with npm in your project directory
- If needed, configure npm to use a different directory for global packages

## Differences Between macOS and Ubuntu Linux

The installation process is nearly identical, with these minor differences:

| Aspect | macOS | Ubuntu Linux |
|--------|-------|--------------|
| Package Manager | Homebrew (`brew`) | APT (`apt`) |
| Node.js Installation | `brew install node` | Use NodeSource repository |
| File Paths | `/Users/username/` | `/home/username/` |
| Default Shell | zsh | bash |
| Permissions | Rarely an issue | May need to configure npm permissions |

## Conclusion

You now have a fully functional 11ty installation! The beauty of 11ty is its simplicity - you write in Markdown, run a build command, and get a complete website ready to upload anywhere.

As a writer and photographer, you can focus on creating content without worrying about databases, server maintenance, or complex deployment pipelines. Just write, build, and upload.

In future posts, I'll cover:
- Creating layouts and templates
- Working with images and galleries
- Setting up automatic deployment to shared hosting
- Creating different content types (posts, notes, links)

Happy blogging!

## Resources

- [11ty Documentation](https://www.11ty.dev/docs/)
- [Node.js Downloads](https://nodejs.org/)
- [Homebrew (macOS)](https://brew.sh/)
- [NodeSource (Ubuntu)](https://github.com/nodesource/distributions)
