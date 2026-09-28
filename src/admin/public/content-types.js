const TYPE_DEFS = {
  post: {
    type: 'post',
    apiType: 'posts',
    label: 'Post',
    bodyLabel: 'Post Body',
    titlePlaceholder: 'Post title',
    bodyPlaceholder: 'Write your post in Markdown...',
    dateInputType: 'date',
    descriptionLabel: 'Summary',
    descriptionPlaceholder: 'Optional summary for previews and SEO',
    showDescription: true,
    showLinkUrl: false,
    showBookmarkUrl: false,
    showQuote: false,
    starterBody: ''
  },
  note: {
    type: 'note',
    apiType: 'notes',
    label: 'Note',
    bodyLabel: 'Note Body',
    bodyPlaceholder: 'Capture the thought while it is still fresh...',
    dateInputType: 'datetime-local',
    showTitle: false,
    showDescription: false,
    showLinkUrl: false,
    showBookmarkUrl: false,
    showQuote: false,
    starterBody: ''
  },
  link: {
    type: 'link',
    apiType: 'links',
    label: 'Link',
    bodyLabel: 'Commentary',
    titlePlaceholder: 'Link title',
    bodyPlaceholder: 'What stood out and why?',
    dateInputType: 'date',
    showDescription: false,
    showLinkUrl: true,
    showBookmarkUrl: false,
    showQuote: true,
    starterBody: ''
  },
  bookmark: {
    type: 'bookmark',
    apiType: 'bookmarks',
    label: 'Bookmark',
    bodyLabel: 'Notes',
    titlePlaceholder: 'Bookmark title',
    bodyPlaceholder: 'Optional notes about this bookmark...',
    dateInputType: 'date',
    descriptionLabel: 'Summary',
    descriptionPlaceholder: 'Optional summary for the bookmark page',
    showDescription: true,
    showLinkUrl: false,
    showBookmarkUrl: true,
    showQuote: false,
    starterBody: ''
  },
  quote: {
    type: 'quote',
    apiType: 'quotes',
    label: 'Quote',
    bodyLabel: 'Quote text',
    bodyPlaceholder: 'Write or paste the quote in Markdown...',
    dateInputType: 'date',
    showTitle: false,
    showDescription: false,
    showLinkUrl: false,
    showBookmarkUrl: false,
    showQuote: false,
    showQuoteAuthor: true,
    showQuoteSourceUrl: true,
    starterBody: ''
  },
  page: {
    type: 'page',
    apiType: 'pages',
    label: 'Page',
    bodyLabel: 'Page body',
    titlePlaceholder: 'Page title',
    bodyPlaceholder: 'Write your page in Markdown...',
    dateInputType: 'date',
    descriptionLabel: 'Summary',
    descriptionPlaceholder: 'Optional summary for previews and SEO',
    showDescription: true,
    showLinkUrl: false,
    showBookmarkUrl: false,
    showQuote: false,
    starterBody: ''
  }
};

const TYPE_ORDER = ['post', 'note', 'quote', 'bookmark', 'page', 'link'];

function pad(value) {
  return String(value).padStart(2, '0');
}

function todayDate() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
}

function localDateTime() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function createBlankEntry(type) {
  const def = TYPE_DEFS[type];
  return {
    type,
    apiType: def.apiType,
    filename: null,
    title: '',
    slug: '',
    date: def.dateInputType === 'datetime-local' ? new Date(localDateTime()).toISOString() : todayDate(),
    tags: [],
    description: '',
    linkUrl: '',
    bookmarkUrl: '',
    quote: '',
    quoteAuthor: '',
    quoteSourceUrl: '',
    body: def.starterBody,
    status: 'draft',
    previewUrl: null,
    updatedAt: null,
    extraFrontmatter: {}
  };
}

function getTypeDef(type) {
  return TYPE_DEFS[type];
}

function getTypeDefByApiType(apiType) {
  return Object.values(TYPE_DEFS).find((def) => def.apiType === apiType);
}

export {
  TYPE_DEFS,
  TYPE_ORDER,
  createBlankEntry,
  getTypeDef,
  getTypeDefByApiType,
  localDateTime
};
