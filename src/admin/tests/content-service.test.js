const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateFilename,
  buildPreviewUrl,
  normalizeEntryPayload,
  parseEntryFile,
  renderPreview,
  serializeEntry,
  validateEntry
} = require('../lib/content-service');

test('generateFilename uses date plus slug for titled entries', () => {
  const entry = normalizeEntryPayload('posts', {
    title: 'Admin V2 Launch Post',
    date: '2026-04-07',
    body: 'Hello world',
    status: 'draft'
  });

  assert.equal(generateFilename('posts', entry), '2026-04-07-admin-v2-launch-post.md');
});

test('generateFilename uses a stable timestamp-based pattern for notes', () => {
  const entry = normalizeEntryPayload('notes', {
    date: '2026-04-07T15:16:17.000Z',
    body: 'Short note',
    status: 'draft'
  });

  assert.equal(generateFilename('notes', entry), '2026-04-07-151617.md');
});

test('parseEntryFile and serializeEntry preserve managed fields and extra frontmatter', () => {
  const raw = `---
title: Existing Post
date: 2026-04-07
tags:
  - meta
layout: layouts/post.njk
draft: true
customField: still-here
---

Body copy.
`;

  const parsed = parseEntryFile('posts', '2026-04-07-existing-post.md', raw, {
    mtime: new Date('2026-04-07T16:00:00.000Z')
  });

  assert.equal(parsed.status, 'draft');
  assert.equal(parsed.extraFrontmatter.customField, 'still-here');
  assert.equal(parsed.body, 'Body copy.');

  const serialized = serializeEntry('posts', parsed);
  assert.match(serialized, /customField: still-here/);
  assert.match(serialized, /draft: true/);
  assert.match(serialized, /permalink: false/);
  assert.match(serialized, /Body copy\./);

  parsed.status = 'published';
  assert.doesNotMatch(serializeEntry('posts', parsed), /permalink: false/);
});

test('validateEntry blocks publish when required content is missing', () => {
  const entry = normalizeEntryPayload('links', {
    title: '',
    date: '2026-04-07',
    linkUrl: '',
    body: '',
    status: 'published'
  });

  const errors = validateEntry('links', entry, 'published');
  assert.deepEqual(errors, [
    'Title is required to publish this entry.',
    'Body content is required to publish this entry.',
    'Link URL is required to publish this entry.'
  ]);
});

test('renderPreview returns article HTML with quote and tags', () => {
  const preview = renderPreview('links', {
    title: 'Skimmers with dreams',
    date: '2026-04-07',
    linkUrl: 'https://example.com/article',
    quote: 'Skim first, then dive deeper.',
    tags: ['reading', 'writing'],
    body: 'A [link](https://example.com) worth keeping.',
    status: 'draft'
  });

  assert.match(preview.html, /Skimmers with dreams/);
  assert.match(preview.html, /#reading/);
  assert.match(preview.html, /Skim first, then dive deeper/);
  assert.match(preview.html, /href="https:\/\/example\.com\/article"/);
});

test('a standalone quote keeps attribution and publishes at its own URL', () => {
  const entry = normalizeEntryPayload('quotes', {
    date: '2026-09-28',
    body: 'Words worth remembering.',
    quoteAuthor: 'A writer',
    quoteSourceUrl: 'https://example.com/source',
    status: 'published'
  });

  assert.deepEqual(validateEntry('quotes', entry, 'published'), []);
  assert.equal(generateFilename('quotes', entry), '2026-09-28-quote.md');
  const raw = serializeEntry('quotes', entry);
  assert.match(raw, /layout: layouts\/quote\.njk/);
  assert.match(raw, /quoteAuthor: A writer/);
  assert.equal(parseEntryFile('quotes', '2026-09-28-quote.md', raw).quoteAuthor, 'A writer');
  assert.equal(buildPreviewUrl('quotes', '2026-09-28-quote.md'), '/quotes/2026-09-28-quote/');
});

test('a page gets a root URL and cannot take a collection route', () => {
  const entry = normalizeEntryPayload('pages', {
    title: 'Now',
    date: '2026-09-28',
    body: 'What I am doing now.',
    status: 'published'
  });

  assert.deepEqual(validateEntry('pages', entry, 'published'), []);
  assert.equal(generateFilename('pages', entry), 'now.md');
  assert.equal(buildPreviewUrl('pages', 'now.md'), '/now/');
  assert.match(serializeEntry('pages', entry), /permalink: \/now\//);

  const reserved = normalizeEntryPayload('pages', { ...entry, title: 'Quotes', slug: 'quotes' });
  assert.match(validateEntry('pages', reserved, 'published').join(' '), /already used/);
});
