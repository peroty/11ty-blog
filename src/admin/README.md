# Blog Admin Interface

A web-based admin interface for managing your 11ty blog content with the TouchGrass theme.

## Features

- ✍️ **Create & Edit Posts** - Full blog posts with title, description, tags, and markdown content
- 📝 **Quick Notes** - Short-form content without titles
- 🔗 **Link Posts** - Share links with commentary and quotes
- 🖼️ **Image Management** - Upload, view, and manage images with drag & drop
- 🏷️ **Tag Management** - Easy tag input with visual tag chips
- 📅 **Auto-filled Frontmatter** - Dates and metadata filled automatically
- 🎨 **TouchGrass Theme** - Matches your blog's dark theme styling

## Getting Started

### 1. Install Dependencies

```bash
npm install --prefix config
```

### 2. Start the Admin Server

```bash
npm run admin --prefix config
```

The admin interface will be available at **http://localhost:3000**

### 3. Start Your 11ty Blog (in another terminal)

```bash
npm run start --prefix config
```

Your blog will be available at **http://localhost:8080**

## Usage

### Creating Content

#### Blog Posts
1. Click the "Posts" tab
2. Click "+ New Post"
3. Fill in:
   - Title (required)
   - Date (auto-filled with today)
   - Description (for SEO)
   - Tags (press Enter after each tag)
   - Content in Markdown
4. Click "Save Post"

#### Notes
1. Click the "Notes" tab
2. Click "+ New Note"
3. Fill in:
   - Date & Time (auto-filled)
   - Tags (optional)
   - Content in Markdown
4. Click "Save Note"

#### Link Posts
1. Click the "Links" tab
2. Click "+ New Link"
3. Fill in:
   - Title (required)
   - Link URL (required)
   - Date (auto-filled)
   - Quote (optional - pull quote from the article)
   - Tags (optional)
   - Commentary in Markdown
4. Click "Save Link"

### Managing Images

1. Click the "Images" tab
2. Either:
   - Drag & drop images onto the upload area
   - Click "Choose Images" to browse
3. Once uploaded, you can:
   - Click "Copy MD" to copy markdown syntax to clipboard
   - Click "Delete" to remove the image

### Using Images in Posts

After uploading an image, click "Copy MD" to get the markdown syntax:

```markdown
![Alt text](/images/your-image.jpg)
```

Paste this into your post content where you want the image to appear.

## File Structure

```
admin/
├── server.js           # Express API server
├── public/
│   ├── index.html     # Admin interface UI
│   └── app.js         # Frontend JavaScript
└── README.md          # This file
```

## API Endpoints

The admin server provides these REST API endpoints:

- `GET /api/posts` - List all posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:filename` - Update post
- `DELETE /api/posts/:filename` - Delete post
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:filename` - Update note
- `DELETE /api/notes/:filename` - Delete note
- `GET /api/links` - List all link posts
- `POST /api/links` - Create new link post
- `PUT /api/links/:filename` - Update link post
- `DELETE /api/links/:filename` - Delete link post
- `GET /api/images` - List all images
- `POST /api/images/upload` - Upload image
- `DELETE /api/images/:filename` - Delete image

## Frontmatter Auto-fill

The admin interface automatically generates proper frontmatter for each content type:

### Posts
```yaml
---
title: "Your Post Title"
date: 2026-01-22
tags:
  - tag1
  - tag2
description: "Your description"
layout: layouts/post.njk
---
```

### Notes
```yaml
---
date: 2026-01-22T15:30:00.000Z
tags:
  - note
layout: layouts/note.njk
---
```

### Links
```yaml
---
title: "Link Title"
date: 2026-01-22
tags:
  - link
linkUrl: https://example.com
layout: layouts/link.njk
quote: >
  Optional pull quote
---
```

## Tips

- **Markdown Support**: Full markdown syntax is supported in all content fields
- **Auto-save**: Changes are saved immediately when you click Save
- **Live Preview**: Keep your blog running (`npm start`) to see changes immediately
- **Image Paths**: Images are stored in `src/images/` and referenced as `/images/filename.jpg`
- **Filename Generation**: Post filenames are auto-generated from title and date (e.g., `2026-01-22-your-post-title.md`)

## Troubleshooting

**Admin won't start**
- Make sure you've run `npm install` first
- Check that port 3000 is not in use

**Can't see images**
- Make sure the `src/images/` directory exists
- Check file permissions

**Changes not appearing on blog**
- Make sure your 11ty blog is running (`npm start`)
- The blog auto-rebuilds when files change

**CORS errors**
- Make sure both the admin server (port 3000) and blog (port 8080) are running
- Clear your browser cache

## Security Note

This admin interface is designed for **local development only**. Do not expose it to the internet without proper authentication and security measures.
