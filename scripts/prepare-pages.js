const fs = require('fs');
const path = require('path');

const prefix = process.env.PAGES_BASE_PATH;
if (!prefix || !/^\/[a-zA-Z0-9._-]+$/.test(prefix)) {
  throw new Error('Set PAGES_BASE_PATH to the GitHub Pages project path, for example /11ty-blog');
}
const siteUrl = process.env.SITE_URL;
if (!siteUrl || new URL(siteUrl).pathname.replace(/\/$/, '') !== prefix) {
  throw new Error('Set SITE_URL to the full GitHub Pages project URL');
}

const outputDir = path.resolve(__dirname, '..', 'config', process.env.SITE_OUTPUT_DIR || '../_site');
const origin = new URL(siteUrl).origin;

function rewriteDirectory(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteDirectory(filePath);
    } else if (entry.isFile() && filePath.endsWith('.html')) {
      const html = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(filePath, html.replace(/\b(href|src|poster|action)=(['"])\/(?!\/)/g, `$1=$2${prefix}/`));
    } else if (entry.isFile() && filePath.endsWith('.xml')) {
      const xml = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(filePath, xml.replaceAll(`${origin}/`, `${siteUrl}/`));
    } else if (entry.isFile() && filePath.endsWith('.css')) {
      const css = fs.readFileSync(filePath, 'utf8');
      fs.writeFileSync(filePath, css.replace(/url\(\s*(['"]?)\/(?!\/)/g, `url($1${prefix}/`));
    }
  }
}

rewriteDirectory(outputDir);
fs.writeFileSync(path.join(outputDir, '.nojekyll'), '');
console.log(`Prepared ${outputDir} for ${prefix}/`);
