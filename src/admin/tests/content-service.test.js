const test = require('node:test');
const assert = require('node:assert/strict');
const {
  generateFilename,
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
  assert.match(serialized, /Body copy\./);
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
