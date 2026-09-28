---
title: "Working with Images in 11ty"
date: 2025-07-21
tags:
  - blog
  - web development
  - images
description: "A demonstration of how to work with images in an 11ty blog."
layout: layouts/post.njk
---

# Working with Images in 11ty

One of the great things about 11ty is how easy it is to work with images. In this post, I'll show you how to use the built-in image shortcode to add responsive images to your blog posts.

## Adding an Image

Here's a simple example of adding an image with a caption:

{# {% image "sample.jpg", "A beautiful landscape with mountains and a lake", "A beautiful landscape with mountains and a lake reflecting the sunset." %} #}

## Responsive Images

The image shortcode automatically generates responsive images in multiple sizes and formats. It creates:

- WebP and JPEG versions of each image
- Multiple sizes for different screen resolutions
- Proper `srcset` and `sizes` attributes for optimal loading

## Styling Images

Images are styled with a subtle border and rounded corners. Captions are displayed below the image in a smaller, muted text.

## Performance Benefits

Using this approach has several benefits:

1. **Faster page loads** - Images are optimized and served in modern formats
2. **Better user experience** - Responsive images ensure fast loading on all devices
3. **Simplified workflow** - Just drop images in the `src/images` folder and reference them in your posts

## Example with Multiple Images

Here's another example with a different aspect ratio:

{# {% image "sample2.jpg", "A close-up of a colorful bird on a branch", "A vibrant bird showcasing its colorful plumage." %} #}

## Conclusion

Adding images to your 11ty blog is straightforward and powerful. The built-in image processing handles all the heavy lifting, so you can focus on creating great content.

What are your favorite tips for working with images in static sites? Let me know in the comments!
