const { DateTime } = require("luxon");
const Image = require("@11ty/eleventy-img");
const { minify } = require("html-minifier-terser");
const { feedPlugin } = require("@11ty/eleventy-plugin-rss");
const metadata = require("./_data/metadata.json");
const siteUrl = process.env.SITE_URL || metadata.url;
const siteOrigin = new URL(siteUrl).origin;
const markdownIt = require("markdown-it");
const fs = require("fs");
const path = require("path");

async function imageShortcode(src, alt, sizes = "100vw") {
  if (!src) {
    return '';
  }
  
  let metadata = await Image(src, {
    widths: [300, 600, 900, 1200],
    formats: ["webp", "jpeg", "png"],
    outputDir: "./_site/img/",
    urlPath: "/img/"
  });

  let imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };

  return Image.generateHTML(metadata, imageAttributes);
}

module.exports = function(eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: { name: "feed", limit: 20 },
    metadata: {
      language: "en",
      title: metadata.title,
      subtitle: metadata.description,
      base: `${siteOrigin}/`,
      author: metadata.author
    }
  });

  eleventyConfig.ignores.add("admin/**");
  eleventyConfig.addGlobalData("siteOrigin", siteOrigin);
  eleventyConfig.addGlobalData("siteUrl", siteUrl);

  // Add shortcodes
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addLiquidShortcode("image", imageShortcode);
  eleventyConfig.addJavaScriptFunction("image", imageShortcode);

  // Add filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("LLLL d, yyyy");
  });

  eleventyConfig.addFilter('htmlDateString', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  eleventyConfig.addFilter('concat', (array1, array2) => {
    return array1.concat(array2);
  });

  eleventyConfig.addFilter('w3DateFilter', (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toISO();
  });

  eleventyConfig.addFilter('markdown', (content) => {
    const md = markdownIt({ html: true });
    return md.render(content);
  });

  eleventyConfig.addFilter("firstImageSrc", (html) => {
    if (!html) {
      return "";
    }

    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match ? match[1] : "";
  });

  // Copy assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");

  eleventyConfig.on("eleventy.after", () => {
    fs.cpSync(path.join(__dirname, "css"), path.join(__dirname, "..", "_site", "css"), {
      recursive: true,
      force: true
    });
    fs.cpSync(path.join(__dirname, "images"), path.join(__dirname, "..", "_site", "images"), {
      recursive: true,
      force: true
    });
    fs.cpSync(path.join(__dirname, "fonts"), path.join(__dirname, "..", "_site", "fonts"), {
      recursive: true,
      force: true
    });
  });

  // Minify HTML in production
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addTransform('htmlmin', async function (content, outputPath) {
      if (outputPath && outputPath.endsWith('.html')) {
        return await minify(content, {
          useShortDoctype: true,
          removeComments: true,
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        });
      }
      return content;
    });
  }

  // Collections
  eleventyConfig.addCollection("posts", function(collection) {
    return collection.getFilteredByGlob("../src/posts/**/*.md")
      .filter(post => !post.data.draft)
      .reverse();
  });

  eleventyConfig.addCollection("notes", function(collection) {
    return collection.getFilteredByGlob("../src/notes/**/*.md")
      .filter(note => !note.data.draft)
      .reverse();
  });

  eleventyConfig.addCollection("linkPosts", function(collection) {
    return collection.getFilteredByGlob("../src/link-posts/**/*.md")
      .filter(link => !link.data.draft)
      .reverse();
  });

  eleventyConfig.addCollection("bookmarks", function(collection) {
    return collection.getFilteredByGlob("../src/bookmarks/**/*.md")
      .filter(bookmark => !bookmark.data.draft)
      .reverse();
  });

  eleventyConfig.addCollection("feed", function(collection) {
    return collection.getFilteredByGlob([
      "../src/posts/**/*.md",
      "../src/notes/**/*.md",
      "../src/link-posts/**/*.md",
      "../src/bookmarks/**/*.md"
    ]).filter(item => !item.data.draft)
      .sort((a, b) => a.date - b.date)
      .map(item => Object.assign(Object.create(item), {
        data: {
          ...item.data,
          title: item.data.title || `Note from ${DateTime.fromJSDate(item.date, { zone: 'utc' }).toFormat('LLLL d, yyyy')}`
        }
      }));
  });

  // Tags collection - get all unique tags with counts
  eleventyConfig.addCollection("tagList", function(collection) {
    const tagCount = {};
    collection.getAll().forEach(item => {
      if (item.data.tags) {
        item.data.tags.forEach(tag => {
          // Skip internal tags
          if (["post", "note", "link", "bookmark", "feed", "all"].includes(tag)) return;
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    // Return as array of {tag, count} sorted by count (most used first)
    return Object.keys(tagCount)
      .sort((a, b) => tagCount[b] - tagCount[a])
      .map(tag => ({ tag, count: tagCount[tag] }));
  });

  // Base Config
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "11ty.js"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
