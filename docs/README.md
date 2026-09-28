# 11ty Blog

A modern, flexible blog built with 11ty, inspired by arcticpalace.org/journal. This blog supports multiple content types including long-form posts, short notes, and link posts with external references.

## Features

- 📝 Multiple content types: posts, notes, and link posts
- 🖼️ Responsive image handling with automatic optimization
- 🎨 Clean, modern design with dark mode support
- 📱 Fully responsive layout
- ⚡ Fast performance with static site generation
- 🔍 SEO optimized
- ✨ Syntax highlighting for code blocks
- 🔗 Easy linking to external content

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/11ty-blog.git
   cd 11ty-blog
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm start
```

This will start a local server at `http://localhost:8080` with live reload.

### Building for Production

To create a production build:

```bash
npm run build
```

The built site will be available in the `_site` directory.

## Content Types

### Posts

Create a new post in `src/posts` with the following front matter:

```markdown
---
title: "Post Title"
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
description: "A brief description of the post"
layout: layouts/post.njk
---

Your post content here...
```

### Notes

Create a new note in `src/notes` with the following front matter:

```markdown
---
date: YYYY-MM-DD HH:MM:SS
tags:
  - note
  - tag1
layout: layouts/note.njk
---

Your note content here...
```

### Link Posts

Create a new link post in `src/link-posts` with the following front matter:

```markdown
---
title: "Link Title"
date: YYYY-MM-DD
tags:
  - link
  - tag1
linkUrl: "https://example.com"
layout: layouts/link.njk
quote: >
  An optional quoted excerpt from the linked content.
---

Your commentary on the linked content...
```

## Images

Place your images in the `src/images` directory. You can then include them in your posts using the image shortcode:

```liquid
{% image "filename.jpg", "Alt text", "Optional caption" %}
```

## Deployment

### Netlify

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Create a new site in Netlify and link to your repository
3. Set the build command to `npm run build`
4. Set the publish directory to `_site`
5. Deploy!

### Vercel

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository in Vercel
3. Set the build command to `npm run build`
4. Set the output directory to `_site`
5. Deploy!

## Customization

### Styling

- Main styles are in `src/css/main.css`
- Color scheme can be modified in the `:root` variables at the top of the file

### Configuration

- Site metadata is in `src/_data/metadata.json`
- 11ty configuration is in `.eleventy.js`

## License

MIT

## Acknowledgments

- [11ty](https://www.11ty.dev/) - The fantastic static site generator
- Inspired by [arcticpalace.org/journal](https://arcticpalace.org/journal/)
