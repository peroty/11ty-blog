import {
  fetchEntries,
  fetchImages,
  fetchTags,
  renderPreview,
  saveEntry,
  deleteEntry,
  uploadImages,
  deploySite
} from './api.js';
import {
  createBlankEntry,
  getTypeDef,
  localDateTime
} from './content-types.js';

const state = {
  entries: [],
  currentEntry: null,
  selectedRecovery: null,
  baselineSnapshot: '',
  filters: {
    search: '',
    type: 'all',
    status: 'all'
  },
  tags: [],
  images: [],
  dirty: false,
  activeInsertTarget: 'body',
  previewTimer: null,
  inspectorTab: 'details',
  inspectorOpen: false
};

const refs = {};

document.addEventListener('DOMContentLoaded', init);

async function init() {
  cacheRefs();
  // Keep metadata and preview beside the writing surface, below its heading.
  document.querySelector('.editor-panel').insertBefore(refs.inspectorRail, refs.editorForm);
  bindEvents();
  await loadWorkspace();
}

function cacheRefs() {
  refs.workspace = document.getElementById('workspace');
  refs.flash = document.getElementById('flash-message');
  refs.recoveryBanner = document.getElementById('recovery-banner');
  refs.recoveryText = document.getElementById('recovery-text');
  refs.restoreRecoveryButton = document.getElementById('restore-recovery-button');
  refs.discardRecoveryButton = document.getElementById('discard-recovery-button');
  refs.searchInput = document.getElementById('search-input');
  refs.typeFilter = document.getElementById('type-filter');
  refs.statusFilter = document.getElementById('status-filter');
  refs.entryList = document.getElementById('entry-list');
  refs.entryCount = document.getElementById('entry-count');
  refs.entryKicker = document.getElementById('entry-kicker');
  refs.entryHeading = document.getElementById('entry-heading');
  refs.entrySubheading = document.getElementById('entry-subheading');
  refs.editorEmptyState = document.getElementById('editor-empty-state');
  refs.editorForm = document.getElementById('entry-form');
  refs.editorHeaderActions = document.querySelector('.editor-header-actions');
  refs.dirtyIndicator = document.getElementById('dirty-indicator');
  refs.statusPill = document.getElementById('entry-status-pill');
  refs.titleField = document.getElementById('title-field');
  refs.titleInput = document.getElementById('entry-title');
  refs.bodyInput = document.getElementById('entry-body');
  refs.bodyLabel = document.getElementById('body-label');
  refs.editorHelp = document.getElementById('editor-help');
  refs.previewRoot = document.getElementById('preview-root');
  refs.inspectorRail = document.getElementById('inspector-rail');
  refs.inspectorTabs = Array.from(document.querySelectorAll('[data-inspector-tab]'));
  refs.inspectorPanes = {
    preview: document.getElementById('inspector-preview'),
    details: document.getElementById('inspector-details'),
    media: document.getElementById('inspector-media')
  };
  refs.dateLabel = document.getElementById('date-label');
  refs.dateInput = document.getElementById('entry-date');
  refs.descriptionField = document.getElementById('description-field');
  refs.descriptionLabel = document.getElementById('description-label');
  refs.descriptionInput = document.getElementById('entry-description');
  refs.linkUrlField = document.getElementById('link-url-field');
  refs.linkUrlInput = document.getElementById('entry-link-url');
  refs.bookmarkUrlField = document.getElementById('bookmark-url-field');
  refs.bookmarkUrlInput = document.getElementById('entry-bookmark-url');
  refs.quoteField = document.getElementById('quote-field');
  refs.quoteInput = document.getElementById('entry-quote');
  refs.quoteAuthorField = document.getElementById('quote-author-field');
  refs.quoteAuthorInput = document.getElementById('entry-quote-author');
  refs.quoteSourceUrlField = document.getElementById('quote-source-url-field');
  refs.quoteSourceUrlInput = document.getElementById('entry-quote-source-url');
  refs.tagChipList = document.getElementById('tag-chip-list');
  refs.tagInput = document.getElementById('tag-input');
  refs.tagSuggestions = document.getElementById('tag-suggestions');
  refs.validationList = document.getElementById('validation-list');
  refs.fileName = document.getElementById('file-name');
  refs.fileSlug = document.getElementById('file-slug');
  refs.fileUpdated = document.getElementById('file-updated');
  refs.filePreview = document.getElementById('file-preview');
  refs.imageList = document.getElementById('image-list');
  refs.imageUploadInput = document.getElementById('image-upload-input');
  refs.refreshButton = document.getElementById('refresh-button');
  refs.viewSiteButton = document.getElementById('view-site-button');
  refs.deployButton = document.getElementById('deploy-button');
  refs.saveDraftButton = document.getElementById('save-draft-button');
  refs.publishButton = document.getElementById('publish-button');
  refs.toggleInspectorButton = document.getElementById('toggle-inspector-button');
  refs.deleteButton = document.getElementById('delete-button');
}

function bindEvents() {
  refs.refreshButton.addEventListener('click', () => {
    loadWorkspace(true);
  });

  refs.viewSiteButton.addEventListener('click', () => {
    window.open('http://127.0.0.1:8080', '_blank');
  });

  refs.deployButton.addEventListener('click', async () => {
    if (state.dirty) {
      showMessage('Save your changes before deploying.', true);
      return;
    }
    if (!window.confirm('Commit blog content and push main to GitHub Pages?')) {
      return;
    }
    refs.deployButton.disabled = true;
    refs.deployButton.textContent = 'Deploying…';
    try {
      await deploySite();
      showMessage('Pushed to GitHub. Pages will update shortly.');
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      refs.deployButton.disabled = false;
      refs.deployButton.textContent = 'Deploy';
    }
  });

  refs.searchInput.addEventListener('input', (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderEntryList();
  });

  refs.typeFilter.addEventListener('change', (event) => {
    state.filters.type = event.target.value;
    renderEntryList();
  });

  refs.statusFilter.addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderEntryList();
  });

  refs.inspectorTabs.forEach((button) => {
    button.addEventListener('click', () => {
      switchInspectorTab(button.dataset.inspectorTab);
    });
  });

  document.querySelectorAll('[data-new-entry]').forEach((button) => {
    button.addEventListener('click', async () => {
      await startNewEntry(button.dataset.newEntry);
    });
  });

  [
    refs.titleInput,
    refs.bodyInput,
    refs.dateInput,
    refs.descriptionInput,
    refs.linkUrlInput,
    refs.bookmarkUrlInput,
    refs.quoteInput,
    refs.quoteAuthorInput,
    refs.quoteSourceUrlInput
  ].forEach((input) => {
    input.addEventListener('input', handleFieldInput);
    input.addEventListener('focus', () => {
      state.activeInsertTarget = input.dataset.insertTarget || 'body';
    });
  });

  refs.tagInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ',') {
      return;
    }
    event.preventDefault();
    addTag(refs.tagInput.value);
  });

  refs.tagInput.addEventListener('blur', () => {
    if (refs.tagInput.value.trim()) {
      addTag(refs.tagInput.value);
    }
  });

  refs.saveDraftButton.addEventListener('click', async () => {
    await persistEntry('draft');
  });

  refs.publishButton.addEventListener('click', async () => {
    await persistEntry('published');
  });

  refs.toggleInspectorButton.addEventListener('click', () => {
    state.inspectorOpen = !state.inspectorOpen;
    renderInspectorVisibility();
  });

  refs.deleteButton.addEventListener('click', async () => {
    await removeCurrentEntry();
  });

  refs.imageUploadInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }

    try {
      await uploadImages(files);
      refs.imageUploadInput.value = '';
      state.images = await fetchImages();
      renderImages();
      showMessage(`Uploaded ${files.length} image${files.length > 1 ? 's' : ''}.`);
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  refs.restoreRecoveryButton.addEventListener('click', () => {
    if (!state.selectedRecovery) {
      return;
    }
    state.currentEntry = structuredClone(state.selectedRecovery.entry);
    renderCurrentEntry();
    updateDirtyState(true);
    hideRecoveryBanner();
    queuePreview();
  });

  refs.discardRecoveryButton.addEventListener('click', () => {
    if (state.selectedRecovery) {
      localStorage.removeItem(state.selectedRecovery.key);
    }
    hideRecoveryBanner();
  });

  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) {
      return;
    }
    event.preventDefault();
    event.returnValue = '';
  });

  window.addEventListener('keydown', async (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!state.currentEntry) {
        return;
      }
      await persistEntry(state.currentEntry.status || 'draft');
    }
  });
}

async function loadWorkspace(showRefreshMessage = false) {
  try {
    const [entries, tags, images] = await Promise.all([
      fetchEntries(['posts', 'notes', 'links', 'bookmarks', 'quotes', 'pages']),
      fetchTags(),
      fetchImages()
    ]);

    state.entries = entries.sort(sortEntries);
    state.tags = tags;
    state.images = images;

    populateTagSuggestions();
    renderEntryList();
    renderImages();

    if (!state.currentEntry) {
      renderIdleWorkspace();
    } else {
      const refreshed = state.currentEntry.filename
        ? state.entries.find((entry) =>
          entry.filename === state.currentEntry.filename && entry.apiType === state.currentEntry.apiType)
        : null;

      if (refreshed) {
        await selectEntry(refreshed, false);
      } else {
        renderIdleWorkspace();
      }
    }

    if (showRefreshMessage) {
      showMessage('Workspace refreshed.');
    }
  } catch (error) {
    showMessage(error.message, true);
  }
}

function sortEntries(a, b) {
  const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (dateDiff !== 0) {
    return dateDiff;
  }
  return (b.updatedAt || '').localeCompare(a.updatedAt || '');
}

function getFilteredEntries() {
  return state.entries.filter((entry) => {
    if (state.filters.type !== 'all' && entry.type !== state.filters.type) {
      return false;
    }

    if (state.filters.status !== 'all' && entry.status !== state.filters.status) {
      return false;
    }

    if (!state.filters.search) {
      return true;
    }

    const haystack = [
      entry.title,
      entry.body,
      entry.filename,
      entry.description,
      entry.linkUrl,
      entry.bookmarkUrl,
      entry.quote,
      entry.quoteAuthor,
      entry.quoteSourceUrl,
      entry.tags.join(' ')
    ].join(' ').toLowerCase();

    return haystack.includes(state.filters.search);
  });
}

function renderEntryList() {
  const filteredEntries = getFilteredEntries();
  refs.entryCount.textContent = `${filteredEntries.length} item${filteredEntries.length === 1 ? '' : 's'}`;

  if (filteredEntries.length === 0) {
    refs.entryList.innerHTML = `
      <div class="empty-card">
        <h3>No matching entries</h3>
        <p>Try a different filter or start a new draft.</p>
      </div>
    `;
    return;
  }

  refs.entryList.innerHTML = filteredEntries.map((entry) => {
    const active = state.currentEntry
      && state.currentEntry.filename === entry.filename
      && state.currentEntry.apiType === entry.apiType;

    return `
      <button class="entry-row ${active ? 'entry-row-active' : ''}" type="button" data-entry-key="${entry.apiType}:${entry.filename}">
        <div class="entry-row-main">
          <strong class="entry-row-title">${escapeHtml(displayEntryTitle(entry))}</strong>
          <span class="entry-status ${entry.status === 'draft' ? 'entry-status-draft' : 'entry-status-published'}">
            ${escapeHtml(entry.status)}
          </span>
        </div>
        <div class="entry-row-meta">
          <span>${escapeHtml(entry.type)}</span>
          <span>${escapeHtml(formatEntryDate(entry))}</span>
        </div>
      </button>
    `;
  }).join('');

  refs.entryList.querySelectorAll('[data-entry-key]').forEach((button) => {
    button.addEventListener('click', async () => {
      const [apiType, filename] = button.dataset.entryKey.split(':');
      const entry = state.entries.find((item) => item.apiType === apiType && item.filename === filename);
      if (entry) {
        await selectEntry(entry);
      }
    });
  });
}

function displayEntryTitle(entry) {
  if (entry.title) {
    return entry.title;
  }

  const stripped = entry.body.replace(/[#>*_`[\]()!-]/g, '').trim();
  return stripped ? stripped.slice(0, 60) : `Untitled ${entry.type}`;
}

function formatEntryDate(entry) {
  const date = new Date(entry.date);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return entry.type === 'note'
    ? date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : date.toLocaleDateString('en-US', { dateStyle: 'medium' });
}

async function confirmNavigation(forcePrompt = true) {
  if (!forcePrompt || !state.dirty) {
    return true;
  }

  return window.confirm('You have unsaved changes. Discard them and continue?');
}

async function startNewEntry(type, requirePrompt = true) {
  const canContinue = await confirmNavigation(requirePrompt);
  if (!canContinue) {
    return;
  }

  state.currentEntry = createBlankEntry(type);
  state.inspectorOpen = ['quote', 'bookmark', 'link'].includes(type);
  state.baselineSnapshot = snapshotEntry(state.currentEntry);
  updateDirtyState(false);
  renderCurrentEntry();
  maybeOfferRecovery();
  queuePreview();
}

async function selectEntry(entry, requirePrompt = true) {
  const canContinue = await confirmNavigation(requirePrompt);
  if (!canContinue) {
    return;
  }

  state.currentEntry = structuredClone(entry);
  state.inspectorOpen = ['quote', 'bookmark', 'link'].includes(entry.type);
  state.baselineSnapshot = snapshotEntry(state.currentEntry);
  updateDirtyState(false);
  renderCurrentEntry();
  maybeOfferRecovery();
  queuePreview();
}

function renderCurrentEntry() {
  const entry = state.currentEntry;
  if (!entry) {
    return;
  }

  const def = getTypeDef(entry.type);

  refs.entryKicker.textContent = `${def.label} workspace`;
  refs.entryHeading.textContent = entry.filename ? displayEntryTitle(entry) : `New ${def.label}`;
  refs.entrySubheading.textContent = entry.filename
    ? `Editing ${entry.filename}`
    : `New ${def.label.toLowerCase()} draft with starter content.`;
  refs.editorEmptyState.classList.add('hidden');
  refs.editorForm.classList.remove('hidden');
  refs.editorHeaderActions.classList.remove('hidden');
  renderInspectorVisibility();
  refs.workspace.classList.remove('workspace-no-inspector');
  refs.workspace.classList.add('workspace-with-inspector');
  refs.statusPill.textContent = entry.status === 'draft' ? 'Draft' : 'Published';
  refs.statusPill.className = `status-pill ${entry.status === 'draft' ? 'status-pill-neutral' : 'status-pill-strong'}`;
  refs.statusPill.classList.remove('hidden');
  refs.titleField.classList.toggle('hidden', def.showTitle === false);
  refs.titleInput.placeholder = def.titlePlaceholder || '';
  refs.titleInput.value = entry.title || '';
  refs.bodyLabel.textContent = def.bodyLabel;
  refs.bodyInput.placeholder = def.bodyPlaceholder;
  refs.bodyInput.value = entry.body || '';
  refs.dateLabel.textContent = def.dateInputType === 'datetime-local' ? 'Date & Time' : 'Date';
  refs.dateInput.type = def.dateInputType;
  refs.dateInput.value = def.dateInputType === 'datetime-local'
    ? localDateTimeValue(entry.date)
    : dateOnlyValue(entry.date);
  refs.descriptionField.classList.toggle('hidden', !def.showDescription);
  refs.descriptionLabel.textContent = def.descriptionLabel || 'Description';
  refs.descriptionInput.placeholder = def.descriptionPlaceholder || '';
  refs.descriptionInput.value = entry.description || '';
  refs.linkUrlField.classList.toggle('hidden', !def.showLinkUrl);
  refs.linkUrlInput.value = entry.linkUrl || '';
  refs.bookmarkUrlField.classList.toggle('hidden', !def.showBookmarkUrl);
  refs.bookmarkUrlInput.value = entry.bookmarkUrl || '';
  refs.quoteField.classList.toggle('hidden', !def.showQuote);
  refs.quoteInput.value = entry.quote || '';
  refs.quoteAuthorField.classList.toggle('hidden', !def.showQuoteAuthor);
  refs.quoteAuthorInput.value = entry.quoteAuthor || '';
  refs.quoteSourceUrlField.classList.toggle('hidden', !def.showQuoteSourceUrl);
  refs.quoteSourceUrlInput.value = entry.quoteSourceUrl || '';

  renderTags();
  renderFileInfo();
  renderValidation();
  renderEntryList();
  switchInspectorTab(state.inspectorTab);
}

function renderIdleWorkspace() {
  state.currentEntry = null;
  state.baselineSnapshot = '';
  updateDirtyState(false);
  refs.entryKicker.textContent = 'Writer';
  refs.entryHeading.textContent = 'Choose an entry or start a new draft';
  refs.entrySubheading.textContent = 'Your writing surface opens here after you pick something from the library or create a new item.';
  refs.editorEmptyState.classList.remove('hidden');
  refs.editorForm.classList.add('hidden');
  refs.editorHeaderActions.classList.add('hidden');
  refs.inspectorRail.classList.add('hidden');
  refs.workspace.classList.remove('workspace-with-inspector');
  refs.workspace.classList.add('workspace-no-inspector');
  refs.statusPill.classList.add('hidden');
  refs.previewRoot.innerHTML = `
    <div class="preview-empty-state">
      <h3>Your preview will appear here</h3>
      <p>Create or open an entry to start composing.</p>
    </div>
  `;
  renderEntryList();
}

function renderInspectorVisibility() {
  refs.inspectorRail.classList.toggle('hidden', !state.inspectorOpen);
  refs.toggleInspectorButton.textContent = state.inspectorOpen ? 'Hide details' : 'Details & preview';
  refs.toggleInspectorButton.setAttribute('aria-expanded', String(state.inspectorOpen));
}

function localDateTimeValue(value) {
  const date = new Date(value || localDateTime());
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function dateOnlyValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function renderTags() {
  refs.tagChipList.innerHTML = state.currentEntry.tags.map((tag, index) => `
    <button class="tag-chip" type="button" data-tag-index="${index}">
      <span>${escapeHtml(tag)}</span>
      <span aria-hidden="true">&times;</span>
    </button>
  `).join('');

  refs.tagChipList.querySelectorAll('[data-tag-index]').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentEntry.tags.splice(Number(button.dataset.tagIndex), 1);
      refs.tagInput.value = '';
      handleEntryMutation();
    });
  });
}

function populateTagSuggestions() {
  refs.tagSuggestions.innerHTML = state.tags
    .map((tagMeta) => `<option value="${escapeHtml(tagMeta.tag)}"></option>`)
    .join('');
}

function renderValidation() {
  const errors = getValidationErrors(state.currentEntry, 'published');

  if (errors.length === 0) {
    refs.validationList.innerHTML = `
      <li class="validation-item validation-ok">Ready to publish.</li>
    `;
    return;
  }

  refs.validationList.innerHTML = errors
    .map((error) => `<li class="validation-item validation-error">${escapeHtml(error)}</li>`)
    .join('');
}

function renderFileInfo() {
  const entry = state.currentEntry;
  refs.fileName.textContent = entry.filename || 'Not saved yet';
  refs.fileSlug.textContent = entry.slug || 'n/a';
  refs.fileUpdated.textContent = entry.updatedAt
    ? new Date(entry.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'n/a';

  if (entry.previewUrl) {
    refs.filePreview.innerHTML = `<a href="${escapeHtml(entry.previewUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(entry.previewUrl)}</a>`;
  } else {
    refs.filePreview.innerHTML = '<span class="muted">Save to get a permalink</span>';
  }
}

function renderImages() {
  if (state.images.length === 0) {
    refs.imageList.innerHTML = `
      <div class="empty-card">
        <p>No uploaded images yet.</p>
      </div>
    `;
    return;
  }

  refs.imageList.innerHTML = state.images.map((image) => `
    <article class="image-row">
      <img src="/api/images/serve/${encodeURIComponent(image.filename)}" alt="${escapeHtml(image.filename)}">
      <div class="image-row-body">
        <h3>${escapeHtml(image.filename)}</h3>
        <div class="image-actions">
          <button class="button button-small button-ghost" type="button" data-image-action="markdown" data-image-file="${image.filename}">MD</button>
          <button class="button button-small button-ghost" type="button" data-image-action="shortcode" data-image-file="${image.filename}">Shortcode</button>
        </div>
      </div>
    </article>
  `).join('');

  refs.imageList.querySelectorAll('[data-image-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const filename = button.dataset.imageFile;
      if (button.dataset.imageAction === 'markdown') {
        insertIntoActiveField(`![Alt text](/images/${filename})`);
      } else {
        insertIntoActiveField(`{% image "${filename}", "Alt text" %}`);
      }
    });
  });
}

function insertIntoActiveField(snippet) {
  const target = state.activeInsertTarget === 'quote' ? refs.quoteInput : refs.bodyInput;
  target.focus();

  const start = target.selectionStart ?? target.value.length;
  const end = target.selectionEnd ?? target.value.length;
  target.value = `${target.value.slice(0, start)}${snippet}${target.value.slice(end)}`;
  target.selectionStart = target.selectionEnd = start + snippet.length;
  handleFieldInput();
}

function addTag(rawTag) {
  const tag = rawTag.trim();
  if (!tag) {
    refs.tagInput.value = '';
    return;
  }

  if (!state.currentEntry.tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
    state.currentEntry.tags.push(tag);
    state.currentEntry.tags.sort((a, b) => a.localeCompare(b));
    handleEntryMutation();
  }

  refs.tagInput.value = '';
}

function handleFieldInput() {
  if (!state.currentEntry) {
    return;
  }

  syncEntryFromForm();
  handleEntryMutation();
}

function syncEntryFromForm() {
  const entry = state.currentEntry;
  const def = getTypeDef(entry.type);

  entry.title = refs.titleInput.value.trim();
  entry.body = refs.bodyInput.value.replace(/\r\n/g, '\n');
  entry.date = def.dateInputType === 'datetime-local'
    ? new Date(refs.dateInput.value || localDateTime()).toISOString()
    : refs.dateInput.value;
  entry.description = refs.descriptionInput.value.trim();
  entry.linkUrl = refs.linkUrlInput.value.trim();
  entry.bookmarkUrl = refs.bookmarkUrlInput.value.trim();
  entry.quote = refs.quoteInput.value.trim();
  entry.quoteAuthor = refs.quoteAuthorInput.value.trim();
  entry.quoteSourceUrl = refs.quoteSourceUrlInput.value.trim();
  if (!entry.filename) {
    entry.slug = entry.title
      ? entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : '';
  }
}

function handleEntryMutation(forceDirty = null) {
  renderTags();
  renderValidation();
  renderFileInfo();
  updateDirtyState(forceDirty);
  persistRecoverySnapshot();
  queuePreview();
  renderEntryList();
}

function updateDirtyState(forceDirty = null) {
  const dirty = forceDirty !== null
    ? forceDirty
    : (state.currentEntry ? snapshotEntry(state.currentEntry) !== state.baselineSnapshot : false);

  state.dirty = dirty;
  refs.dirtyIndicator.classList.toggle('hidden', !dirty);
}

function queuePreview() {
  clearTimeout(state.previewTimer);
  state.previewTimer = setTimeout(async () => {
    if (!state.currentEntry) {
      return;
    }
    try {
      const preview = await renderPreview(state.currentEntry);
      refs.previewRoot.innerHTML = preview.html;
    } catch (error) {
      refs.previewRoot.innerHTML = `
        <div class="empty-card">
          <h3>Preview unavailable</h3>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    }
  }, 150);
}

function getValidationErrors(entry, targetStatus) {
  const errors = [];

  if (!entry.date || Number.isNaN(new Date(entry.date).getTime())) {
    errors.push('A valid date is required.');
  }

  if (targetStatus === 'published') {
    if (entry.type !== 'note' && entry.type !== 'quote' && !entry.title) {
      errors.push('Title is required for published entries of this type.');
    }
    if (entry.type === 'link' && !entry.linkUrl) {
      errors.push('Link URL is required for published links.');
    }
    if (entry.type === 'bookmark' && !entry.bookmarkUrl) {
      errors.push('Bookmark URL is required for published bookmarks.');
    }
    if (entry.type !== 'bookmark' && !entry.body.trim()) {
      errors.push('Body content is required to publish this entry.');
    }
  }

  ['linkUrl', 'bookmarkUrl', 'quoteSourceUrl'].forEach((field) => {
    if (!entry[field]) {
      return;
    }
    try {
      // eslint-disable-next-line no-new
      new URL(entry[field]);
    } catch {
      errors.push(`${field === 'linkUrl' ? 'Link' : field === 'bookmarkUrl' ? 'Bookmark' : 'Quote source'} URL must be valid.`);
    }
  });

  return errors;
}

async function persistEntry(targetStatus) {
  if (!state.currentEntry) {
    return;
  }

  syncEntryFromForm();
  state.currentEntry.status = targetStatus;
  renderValidation();

  const errors = getValidationErrors(state.currentEntry, targetStatus);
  if (errors.length > 0) {
    showMessage(errors[0], true);
    return;
  }

  try {
    const response = await saveEntry(state.currentEntry);
    const savedEntry = response.entry;
    state.entries = upsertEntry(savedEntry);
    clearRecoveryKeys(state.currentEntry);
    state.currentEntry = structuredClone(savedEntry);
    state.baselineSnapshot = snapshotEntry(state.currentEntry);
    updateDirtyState(false);
    populateTagSuggestionsAfterSave(savedEntry);
    renderCurrentEntry();
    renderEntryList();
    queuePreview();
    showMessage(targetStatus === 'draft' ? 'Draft saved.' : 'Entry published.');
  } catch (error) {
    showMessage(error.message, true);
  }
}

function populateTagSuggestionsAfterSave(savedEntry) {
  savedEntry.tags.forEach((tag) => {
    if (!state.tags.some((item) => item.tag.toLowerCase() === tag.toLowerCase())) {
      state.tags.push({ tag, count: 1 });
    }
  });
  populateTagSuggestions();
}

function upsertEntry(entry) {
  const otherEntries = state.entries.filter((item) => !(item.filename === entry.filename && item.apiType === entry.apiType));
  return [entry, ...otherEntries].sort(sortEntries);
}

async function removeCurrentEntry() {
  if (!state.currentEntry) {
    return;
  }

  if (!state.currentEntry.filename) {
    const confirmed = window.confirm('Discard this unsaved draft?');
    if (!confirmed) {
      return;
    }
    clearRecoveryKeys(state.currentEntry);
    await startNewEntry(state.currentEntry.type, false);
    return;
  }

  const confirmed = window.confirm(`Delete ${displayEntryTitle(state.currentEntry)}? This cannot be undone.`);
  if (!confirmed) {
    return;
  }

  try {
    await deleteEntry(state.currentEntry);
    clearRecoveryKeys(state.currentEntry);
    state.entries = state.entries.filter((entry) =>
      !(entry.filename === state.currentEntry.filename && entry.apiType === state.currentEntry.apiType));
    showMessage('Entry deleted.');
    renderIdleWorkspace();
  } catch (error) {
    showMessage(error.message, true);
  }
}

function snapshotEntry(entry) {
  if (!entry) {
    return '';
  }

  return JSON.stringify({
    apiType: entry.apiType,
    filename: entry.filename,
    title: entry.title,
    slug: entry.slug,
    date: entry.date,
    tags: entry.tags,
    description: entry.description,
    linkUrl: entry.linkUrl,
    bookmarkUrl: entry.bookmarkUrl,
    quote: entry.quote,
    quoteAuthor: entry.quoteAuthor,
    quoteSourceUrl: entry.quoteSourceUrl,
    body: entry.body,
    status: entry.status,
    extraFrontmatter: entry.extraFrontmatter
  });
}

function getRecoveryKey(entry) {
  return entry.filename
    ? `blog-admin-v2:${entry.apiType}:${entry.filename}`
    : `blog-admin-v2:new:${entry.type}`;
}

function persistRecoverySnapshot() {
  if (!state.currentEntry || !state.dirty) {
    return;
  }

  localStorage.setItem(getRecoveryKey(state.currentEntry), JSON.stringify({
    savedAt: new Date().toISOString(),
    entry: state.currentEntry
  }));
}

function maybeOfferRecovery() {
  const key = getRecoveryKey(state.currentEntry);
  const rawRecovery = localStorage.getItem(key);
  hideRecoveryBanner();

  if (!rawRecovery) {
    return;
  }

  try {
    const parsed = JSON.parse(rawRecovery);
    if (snapshotEntry(parsed.entry) === snapshotEntry(state.currentEntry)) {
      localStorage.removeItem(key);
      return;
    }

    state.selectedRecovery = { ...parsed, key };
    refs.recoveryText.textContent = `Recovered local changes from ${new Date(parsed.savedAt).toLocaleString()}.`;
    refs.recoveryBanner.classList.remove('hidden');
  } catch {
    localStorage.removeItem(key);
  }
}

function hideRecoveryBanner() {
  state.selectedRecovery = null;
  refs.recoveryBanner.classList.add('hidden');
}

function switchInspectorTab(tab) {
  state.inspectorTab = tab;
  refs.inspectorTabs.forEach((button) => {
    button.classList.toggle('inspector-tab-active', button.dataset.inspectorTab === tab);
  });
  Object.entries(refs.inspectorPanes).forEach(([name, pane]) => {
    pane.classList.toggle('hidden', name !== tab);
  });
}

function clearRecoveryKeys(entry) {
  localStorage.removeItem(getRecoveryKey(entry));
  if (!entry.filename) {
    return;
  }
  localStorage.removeItem(`blog-admin-v2:new:${entry.type}`);
}

function showMessage(message, isError = false) {
  refs.flash.textContent = message;
  refs.flash.className = `flash-message ${isError ? 'flash-message-error' : 'flash-message-success'}`;
  window.clearTimeout(showMessage.timeoutId);
  showMessage.timeoutId = window.setTimeout(() => {
    refs.flash.className = 'flash-message';
    refs.flash.textContent = '';
  }, 4000);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
