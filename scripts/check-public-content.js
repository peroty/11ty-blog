const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const matter = require('../config/node_modules/gray-matter');
const root = path.resolve(__dirname, '..');
const folders = ['posts', 'notes', 'link-posts', 'bookmarks', 'quotes', 'pages'];

function checkText(filename, text) {
  if (matter(text).data.draft) throw new Error(`Refusing to deploy draft content: ${filename}. Save it through the editor to move it into private storage.`);
}

function checkPublicContent(projectRoot = root, options = {}) {
  function walk(directory) {
    if (!fs.existsSync(directory)) return;
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.name.endsWith('.md')) checkText(path.relative(projectRoot, file), fs.readFileSync(file, 'utf8'));
    }
  }
  folders.forEach(folder => walk(path.join(projectRoot, 'src', folder)));
  const git = args => execFileSync('git', args, { cwd: projectRoot, encoding: 'utf8' });
  // Inspect the index as well: ignored files can still be force-added, and staged
  // content can differ from what is on disk.
  for (const file of git(['ls-files', '-z']).split('\0').filter(Boolean)) {
    if (file.startsWith('.local-drafts/')) {
      throw new Error(`Private storage is tracked by Git: ${file}. Remove it from the index before deploying.`);
    }
    if (!options.worktreeOnly && /^src\/(posts|notes|link-posts|bookmarks|quotes|pages)\/.*\.md$/.test(file)) {
      checkText(file, git(['show', `:${file}`]));
    }
  }
}

if (require.main === module) {
  try {
    checkPublicContent(root, { worktreeOnly: process.argv.includes('--worktree') });
    console.log('Public content check passed: no draft-marked entries or tracked private storage.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { checkPublicContent };
