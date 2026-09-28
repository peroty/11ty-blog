const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItFootnote = require('markdown-it-footnote');

const CONTENT_ROOT = path.resolve(__dirname, '../..');

const TYPE_CONFIG = {
  posts: {
    apiType: 'posts',
    entryType: 'post',
    dir: 'posts',
    layout: 'layouts/post.njk',
    urlPrefix: '/posts/',
    titled: true,
    dateMode: 'date',
    publishRequired: ['title', 'body']
  },
  notes: {
    apiType: 'notes',
    entryType: 'note',
    dir: 'notes',
    layout: 'layouts/note.njk',
    urlPrefix: '/notes/',
    titled: false,
    dateMode: 'datetime',
    publishRequired: ['body']
  },
  links: {
    apiType: 'links',
    entryType: 'link',
    dir: 'link-posts',
    layout: 'layouts/link.njk',
    urlPrefix: '/link-posts/',
    titled: true,
    dateMode: 'date',
    publishRequired: ['title', 'linkUrl', 'body']
  },
  bookmarks: {
    apiType: 'bookmarks',
    entryType: 'bookmark',
    dir: 'bookmarks',
    layout: 'layouts/bookmark.njk',
    urlPrefix: '/bookmarks/',
    titled: true,
    dateMode: 'date',
    publishRequired: ['title', 'bookmarkUrl']
  }
};

const INTERNAL_TAGS = new Set(['post', 'note', 'link', 'bookmark', 'all']);
const markdown = new MarkdownIt({
  html: true,
  linkify: true
})
  .use(markdownItFootnote)
  .use(markdownItAnchor);

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

function getTypeConfig(apiType) {
  const config = TYPE_CONFIG[apiType];
  if (!config) {
    throw new ValidationError('Invalid content type');
  }
  return config;
}

function getContentDir(apiType) {
  return path.join(CONTENT_ROOT, getTypeConfig(apiType).dir);
}

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'untitled';
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDateOnly(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatDateOnly(new Date());
  }
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function formatDateTime(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function formatLocalDateTimeInput(value = new Date()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatLocalDateTimeInput(new Date());
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function normalizeDateForType(value, config) {
  return config.dateMode === 'datetime'
    ? formatDateTime(value)
    : formatDateOnly(value);
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanMultilineString(value) {
  return typeof value === 'string'
    ? value.replace(/\r\n/g, '\n').trim()
    : '';
}

function normalizeBody(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\r\n/g, '\n').replace(/^\n+/, '').trimEnd();
}

function cleanTags(tags) {
  if (!tags) {
    return [];
  }

  const rawTags = Array.isArray(tags)
    ? tags
    : String(tags).split(',');

  const deduped = [];
  const seen = new Set();

  rawTags.forEach((tag) => {
    const cleanTag = cleanString(tag);
    const key = cleanTag.toLowerCase();
    if (!cleanTag || seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(cleanTag);
  });

  return deduped;
}

function extractSlugFromFilename(filename) {
  const base = path.basename(filename, '.md');
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, '');
}

function buildPreviewUrl(apiType, filename) {
  const config = getTypeConfig(apiType);
  const base = path.basename(filename, '.md');
  return `${config.urlPrefix}${base}/`;
}

function getDefaultDate(config) {
  return normalizeDateForType(new Date(), config);
}

function normalizeExtraFrontmatter(extraFrontmatter = {}) {
  if (!extraFrontmatter || typeof extraFrontmatter !== 'object' || Array.isArray(extraFrontmatter)) {
    return {};
  }
  return { ...extraFrontmatter };
}

function removeManagedKeys(frontmatter) {
  const extra = { ...frontmatter };
  [
    'title',
    'date',
    'tags',
    'description',
    'layout',
    'linkUrl',
    'bookmarkUrl',
    'quote',
    'draft'
  ].forEach((key) => {
    delete extra[key];
  });
  return extra;
}

function normalizeEntryPayload(apiType, payload = {}, fallbackEntry = null) {
  const config = getTypeConfig(apiType);
  const source = { ...(fallbackEntry || {}), ...(payload || {}) };
  const title = config.titled ? cleanString(source.title) : '';
  const date = normalizeDateForType(source.date || getDefaultDate(config), config);
  const body = normalizeBody(source.body);
  const status = source.status === 'draft' ? 'draft' : 'published';

  return {
    apiType,
    type: config.entryType,
    filename: source.filename || fallbackEntry?.filename || null,
    status,
    title,
    slug: config.titled ? slugify(source.slug || title || fallbackEntry?.slug || '') : '',
    date,
    tags: cleanTags(source.tags),
    description: cleanString(source.description),
    linkUrl: cleanString(source.linkUrl),
    bookmarkUrl: cleanString(source.bookmarkUrl),
    quote: cleanMultilineString(source.quote),
    body,
    previewUrl: source.previewUrl || fallbackEntry?.previewUrl || null,
    updatedAt: source.updatedAt || fallbackEntry?.updatedAt || null,
    extraFrontmatter: normalizeExtraFrontmatter(
      source.extraFrontmatter !== undefined
        ? source.extraFrontmatter
        : fallbackEntry?.extraFrontmatter
    )
  };
}

function validateEntry(apiType, entry, targetStatus = entry.status) {
  const config = getTypeConfig(apiType);
  const errors = [];

  if (!entry.date || Number.isNaN(new Date(entry.date).getTime())) {
    errors.push('A valid date is required.');
  }

  if (targetStatus === 'published') {
    if (config.publishRequired.includes('title') && !entry.title) {
      errors.push('Title is required to publish this entry.');
    }
    if (config.publishRequired.includes('body') && !entry.body) {
      errors.push('Body content is required to publish this entry.');
    }
    if (config.publishRequired.includes('linkUrl') && !entry.linkUrl) {
      errors.push('Link URL is required to publish this entry.');
    }
    if (config.publishRequired.includes('bookmarkUrl') && !entry.bookmarkUrl) {
      errors.push('Bookmark URL is required to publish this entry.');
    }
  }

  ['linkUrl', 'bookmarkUrl'].forEach((field) => {
    if (!entry[field]) {
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(entry[field]);
    } catch {
      errors.push(`${field === 'linkUrl' ? 'Link' : 'Bookmark'} URL must be valid.`);
    }
  });

  return errors;
}

function generateFilename(apiType, entry) {
  const config = getTypeConfig(apiType);
  if (config.titled) {
    return `${formatDateOnly(entry.date)}-${entry.slug || slugify(entry.title)}.md`;
  }

  const date = new Date(entry.date);
  const fileDate = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  const timePart = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
  return `${fileDate}-${timePart}.md`;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureUniqueFilename(apiType, desiredFilename) {
  const dirPath = getContentDir(apiType);
  const ext = path.extname(desiredFilename);
  const base = path.basename(desiredFilename, ext);

  let candidate = desiredFilename;
  let counter = 2;

  while (await exists(path.join(dirPath, candidate))) {
    candidate = `${base}-${counter}${ext}`;
    counter += 1;
  }

  return candidate;
}

function buildFrontmatter(apiType, entry) {
  const config = getTypeConfig(apiType);
  const frontmatter = {};

  if (config.titled && entry.title) {
    frontmatter.title = entry.title;
  }
  frontmatter.date = entry.date;
  if (entry.tags.length > 0) {
    frontmatter.tags = entry.tags;
  }
  if (entry.description) {
    frontmatter.description = entry.description;
  }
  if (entry.linkUrl) {
    frontmatter.linkUrl = entry.linkUrl;
  }
  if (entry.bookmarkUrl) {
    frontmatter.bookmarkUrl = entry.bookmarkUrl;
  }
  frontmatter.layout = config.layout;
  if (entry.quote) {
    frontmatter.quote = entry.quote;
  }
  if (entry.status === 'draft') {
    frontmatter.draft = true;
  }

  return {
    ...normalizeExtraFrontmatter(entry.extraFrontmatter),
    ...frontmatter
  };
}

function serializeEntry(apiType, entry) {
  const frontmatter = buildFrontmatter(apiType, entry);
  const body = entry.body ? `${entry.body}\n` : '';

  return matter.stringify(body, frontmatter, {
    engines: {
      yaml: {
        parse: yaml.load,
        stringify: (data) => yaml.dump(data, {
          lineWidth: 120,
          noRefs: true,
          quotingType: '"'
        }).trim()
      }
    }
  });
}

function parseEntryFile(apiType, filename, fileContents, stats = null) {
  const config = getTypeConfig(apiType);
  const parsed = matter(fileContents);
  const data = parsed.data || {};
  const title = config.titled ? cleanString(data.title) : '';

  const entry = normalizeEntryPayload(apiType, {
    filename,
    status: data.draft ? 'draft' : 'published',
    title,
    slug: config.titled ? extractSlugFromFilename(filename) : '',
    date: data.date || getDefaultDate(config),
    tags: data.tags,
    description: data.description,
    linkUrl: data.linkUrl,
    bookmarkUrl: data.bookmarkUrl,
    quote: data.quote,
    body: parsed.content,
    previewUrl: buildPreviewUrl(apiType, filename),
    updatedAt: stats?.mtime?.toISOString() || null,
    extraFrontmatter: removeManagedKeys(data)
  });

  return entry;
}

async function readEntry(apiType, filename) {
  const filePath = path.join(getContentDir(apiType), filename);
  const [fileContents, stats] = await Promise.all([
    fs.readFile(filePath, 'utf-8'),
    fs.stat(filePath)
  ]);
  return parseEntryFile(apiType, filename, fileContents, stats);
}

async function listEntries(apiType) {
  const dirPath = getContentDir(apiType);
  await fs.mkdir(dirPath, { recursive: true });

  const files = (await fs.readdir(dirPath))
    .filter((file) => file.endsWith('.md'));

  const entries = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(dirPath, filename);
      const [fileContents, stats] = await Promise.all([
        fs.readFile(filePath, 'utf-8'),
        fs.stat(filePath)
      ]);
      return parseEntryFile(apiType, filename, fileContents, stats);
    })
  );

  return entries.sort((a, b) => {
    const primary = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (primary !== 0) {
      return primary;
    }
    return (b.updatedAt || '').localeCompare(a.updatedAt || '');
  });
}

async function writeEntry(apiType, payload, options = {}) {
  const dirPath = getContentDir(apiType);
  await fs.mkdir(dirPath, { recursive: true });

  const existingEntry = options.filename
    ? await readEntry(apiType, options.filename)
    : null;

  const entry = normalizeEntryPayload(apiType, payload, existingEntry);
  const validationErrors = validateEntry(apiType, entry, entry.status);

  if (validationErrors.length > 0) {
    throw new ValidationError('Entry validation failed', validationErrors);
  }

  const desiredFilename = existingEntry
    ? existingEntry.filename
    : (payload.filename || generateFilename(apiType, entry));

  const filename = existingEntry
    ? desiredFilename
    : await ensureUniqueFilename(apiType, desiredFilename);

  const filePath = path.join(dirPath, filename);
  const serialized = serializeEntry(apiType, { ...entry, filename });

  await fs.writeFile(filePath, serialized, 'utf-8');
  return readEntry(apiType, filename);
}

async function deleteEntry(apiType, filename) {
  await fs.unlink(path.join(getContentDir(apiType), filename));
}

async function collectTagMetadata() {
  const tagCounts = new Map();

  await Promise.all(Object.keys(TYPE_CONFIG).map(async (apiType) => {
    const entries = await listEntries(apiType);
    entries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        if (INTERNAL_TAGS.has(tag.toLowerCase())) {
          return;
        }
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
  }));

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.tag.localeCompare(b.tag);
    });
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderTagMarkup(tags) {
  const visibleTags = tags.filter((tag) => !INTERNAL_TAGS.has(tag.toLowerCase()));
  if (visibleTags.length === 0) {
    return '';
  }

  const items = visibleTags.map((tag) => `<span class="preview-tag">#${escapeHtml(tag)}</span>`).join('');
  return `<div class="preview-tags">${items}</div>`;
}

function formatReadableDate(value, apiType) {
  const config = getTypeConfig(apiType);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return config.dateMode === 'datetime'
    ? date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString('en-US', { dateStyle: 'long' });
}

function renderPreview(apiType, payload) {
  const entry = normalizeEntryPayload(apiType, payload);
  const config = getTypeConfig(apiType);
  const title = config.titled ? (entry.title || `Untitled ${config.entryType}`) : 'Note';
  const bodyHtml = entry.body
    ? markdown.render(entry.body)
    : '<p class="preview-empty">Start writing to see the preview.</p>';
  const tagMarkup = renderTagMarkup(entry.tags);
  const readableDate = formatReadableDate(entry.date, apiType);

  let leadMarkup = '';
  if (entry.description) {
    leadMarkup = `<p class="preview-lead">${escapeHtml(entry.description)}</p>`;
  }
  if (entry.quote) {
    leadMarkup += `<blockquote class="preview-quote">${markdown.renderInline(entry.quote)}</blockquote>`;
  }
  if (entry.linkUrl) {
    leadMarkup += `<p class="preview-source"><a href="${escapeHtml(entry.linkUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.linkUrl)}</a></p>`;
  }
  if (entry.bookmarkUrl) {
    leadMarkup += `<p class="preview-source"><a href="${escapeHtml(entry.bookmarkUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.bookmarkUrl)}</a></p>`;
  }

  const html = `
    <article class="preview-entry preview-entry-${config.entryType}">
      <header class="preview-header">
        <p class="preview-kicker">${escapeHtml(config.entryType.toUpperCase())}${entry.status === 'draft' ? ' · Draft' : ''}</p>
        <h1>${escapeHtml(title)}</h1>
        <div class="preview-meta">
          <span>${escapeHtml(readableDate)}</span>
        </div>
        ${tagMarkup}
      </header>
      ${leadMarkup}
      <div class="preview-body">
        ${bodyHtml}
      </div>
    </article>
  `;

  return {
    html,
    entry
  };
}

module.exports = {
  TYPE_CONFIG,
  ValidationError,
  buildPreviewUrl,
  collectTagMetadata,
  formatLocalDateTimeInput,
  generateFilename,
  getContentDir,
  listEntries,
  normalizeEntryPayload,
  parseEntryFile,
  readEntry,
  renderPreview,
  serializeEntry,
  validateEntry,
  writeEntry,
  deleteEntry
};
