const fs = require('fs');
const path = require('path');

const outputDir = path.resolve(__dirname, '..', 'config', process.env.SITE_OUTPUT_DIR || '../_site');
const projectRoot = path.resolve(__dirname, '..');
if (![path.join(projectRoot, '_site'), path.join(projectRoot, '_site-pages')].includes(outputDir)) {
  throw new Error(`Refusing to clean unexpected output directory: ${outputDir}`);
}

fs.rmSync(outputDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
