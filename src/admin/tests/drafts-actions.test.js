const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const matter = require('gray-matter');

function runAction(kind, options = {}) {
  const requests = [];
  const prompts = [];
  const errors = [];
  let credentials = 0;
  const item = { uuid: '1234-abcd', content: 'A title\nhttps://example.com\n\nMy café commentary', tags: [],
    addTag(tag) { this.tags.push(tag); }, update() {} };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../../../tools/drafts', `publish-${kind}.js`), 'utf8'), {
    draft: item,
    context: { cancel() {}, fail(message) { errors.push(message); } },
    Prompt: { create() {
      const number = prompts.length;
      const prompt = { fieldValues: {}, addButton() {},
        addTextField(key, label, value) { this.fieldValues[key] = value; },
        addTextView(key, label, value) { this.fieldValues[key] = value; },
        show() {
          if (number === 0) Object.assign(this.fieldValues, options.fields || {});
          return options.cancelAt !== number;
        } };
      prompts.push(prompt);
      return prompt;
    } },
    Credential: { create() { credentials++; return { addPasswordField() {}, authorize() { return true; }, getValue() { return 'simulated-token'; } }; } },
    HTTP: { create() { return { request(request) {
      requests.push(request);
      return request.method === 'GET'
        ? { success: !!options.existing, statusCode: options.existing ? 200 : 404 }
        : { success: !options.failPut, statusCode: options.failPut ? 403 : 201 };
    } }; } },
    Base64: { encode(text) { return Buffer.from(text, 'utf8').toString('base64'); } }
  });
  return { requests, prompts, errors, credentials, item };
}

test('cancelled Drafts review never requests credentials or contacts GitHub', () => {
  for (const cancelAt of [0, 1]) {
    const result = runAction('link', { cancelAt });
    assert.equal(result.credentials, 0);
    assert.equal(result.requests.length, 0);
  }
});

test('Drafts publication sends UTF-8 Markdown and blocks duplicate/failed posts', () => {
  const result = runAction('link', { fields: { tags: 'reading, personal' } });
  assert.deepEqual(result.requests.map(r => r.method), ['GET', 'PUT']);
  const post = matter(Buffer.from(result.requests[1].data.content, 'base64').toString('utf8'));
  assert.equal(post.data.title, 'A title');
  assert.equal(post.data.linkUrl, 'https://example.com');
  assert.match(post.content, /café/);
  assert.equal(post.data.draft, undefined);
  assert.deepEqual(result.item.tags, ['blog-published']);
  const duplicate = runAction('link', { existing: true });
  assert.equal(duplicate.requests.length, 1);
  assert.match(duplicate.errors[0], /already been published/);
  const failure = runAction('link', { failPut: true });
  assert.equal(failure.item.tags.length, 0);
  assert.match(failure.errors[0], /failed/);
});

test('Drafts quote action preserves attribution and optional source', () => {
  const result = runAction('quote', { fields: { body: 'A quote', author: 'A Writer', url: 'https://example.com/source', tags: '' } });
  const post = matter(Buffer.from(result.requests[1].data.content, 'base64').toString('utf8'));
  assert.equal(post.data.quoteAuthor, 'A Writer');
  assert.equal(post.data.quoteSourceUrl, 'https://example.com/source');
  assert.match(post.content, /A quote/);
  assert.match(result.requests[1].url, /src\/quotes\/1234-abcd.md$/);
});
