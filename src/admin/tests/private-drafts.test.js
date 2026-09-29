const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const root = require('fs').mkdtempSync(path.join(os.tmpdir(), 'blog-private-drafts-'));
process.env.EDITOR_CONTENT_ROOT = path.join(root, 'src');
const service = require('../lib/content-service');
const { checkPublicContent } = require('../../../scripts/check-public-content');
test.after(() => fs.rm(root, { recursive: true, force: true }));

test('drafts and revisions remain private; only publishing promotes referenced images', async () => {
  const draft = await service.writeEntry('posts', {
    title: 'Private thought', body: 'Unfinished', date: '2026-09-29', status: 'draft'
  });
  const publicPath = path.join(root, 'src/posts', draft.filename);
  await assert.rejects(fs.access(publicPath), { code: 'ENOENT' });
  assert.match(await fs.readFile(path.join(service.getDraftDir('posts'), draft.filename), 'utf8'), /Unfinished/);
  await fs.mkdir(service.PRIVATE_IMAGES, { recursive: true });
  await fs.writeFile(path.join(service.PRIVATE_IMAGES, 'selected.png'), 'selected');
  await fs.writeFile(path.join(service.PRIVATE_IMAGES, 'unused.png'), 'unused');
  const published = await service.writeEntry('posts', {
    ...draft, status: 'published', body: 'Finished ![Photo](/images/selected.png)'
  }, { filename: draft.filename });
  const original = await fs.readFile(publicPath, 'utf8');
  assert.match(original, /Finished/);
  await fs.access(path.join(root, 'src/images/selected.png'));
  await assert.rejects(fs.access(path.join(root, 'src/images/unused.png')), { code: 'ENOENT' });
  const revision = await service.writeEntry('posts', {
    ...published, status: 'draft', body: 'Secret revision'
  }, { filename: published.filename });
  assert.equal(revision.hasPublishedVersion, true);
  assert.equal(await fs.readFile(publicPath, 'utf8'), original);
  assert.equal((await service.listEntries('posts')).length, 1);
  assert.equal((await service.readEntry('posts', published.filename)).body, 'Secret revision');
  await service.deleteEntry('posts', published.filename);
  assert.equal((await service.readEntry('posts', published.filename)).status, 'published');
  assert.equal(await fs.readFile(publicPath, 'utf8'), original);
});

test('legacy drafts move out of src without loss', async () => {
  const dir = path.join(root, 'src/notes');
  await fs.mkdir(dir, { recursive: true });
  const source = '---\ndate: 2026-09-29\ndraft: true\n---\nLegacy private note\n';
  await fs.writeFile(path.join(dir, 'legacy.md'), source);
  const entries = await service.listEntries('notes');
  assert.equal(entries[0].status, 'draft');
  assert.equal(await fs.readFile(path.join(service.getDraftDir('notes'), 'legacy.md'), 'utf8'), source);
  await assert.rejects(fs.access(path.join(dir, 'legacy.md')), { code: 'ENOENT' });
});

test('failed image promotion preserves private writing and publishes no other image', async () => {
  await fs.writeFile(path.join(service.PRIVATE_IMAGES, 'fresh.png'), 'private');
  await fs.writeFile(path.join(service.PRIVATE_IMAGES, 'conflict.png'), 'private version');
  await fs.writeFile(path.join(root, 'src/images/conflict.png'), 'public version');
  const draft = await service.writeEntry('notes', {
    status: 'draft', date: '2026-09-29T12:00:00Z',
    body: '![First](/images/fresh.png) ![Second](/images/conflict.png)'
  });
  assert.match(service.renderPreview('notes', draft).html, /\/api\/images\/serve\/fresh.png/);
  await assert.rejects(service.writeEntry('notes', { ...draft, status: 'published' }, { filename: draft.filename }), /Image already exists publicly/);
  await assert.rejects(fs.access(path.join(root, 'src/images/fresh.png')), { code: 'ENOENT' });
  await assert.rejects(fs.access(path.join(root, 'src/notes', draft.filename)), { code: 'ENOENT' });
  assert.equal((await service.readEntry('notes', draft.filename)).status, 'draft');
});

test('deployment rejects public drafts, staged drafts and force-added private files', async () => {
  const git = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
  git(['init', '-q']);
  await fs.writeFile(path.join(root, '.gitignore'), '.local-drafts/\n');
  git(['add', '.']);
  checkPublicContent(root);
  const note = path.join(root, 'src/notes/leak.md');
  await fs.writeFile(note, '---\ndraft: true\n---\nPrivate\n');
  assert.throws(() => checkPublicContent(root), /Refusing to deploy draft/);
  git(['add', 'src/notes/leak.md']);
  await fs.writeFile(note, '---\ndraft: false\n---\nPublished\n');
  assert.throws(() => checkPublicContent(root), /Refusing to deploy draft/);
  git(['add', 'src/notes/leak.md']);
  checkPublicContent(root);
  git(['add', '-f', '.local-drafts/notes/legacy.md']);
  assert.throws(() => checkPublicContent(root), /Private storage is tracked/);
});
