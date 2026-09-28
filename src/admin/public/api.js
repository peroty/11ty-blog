const API_BASE = 'http://localhost:3000/api';

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detailText = Array.isArray(data.details) && data.details.length
      ? ` ${data.details.join(' ')}`
      : '';
    throw new Error(`${data.error || 'Request failed.'}${detailText}`);
  }

  return data;
}

async function fetchEntries(apiTypes) {
  const groups = await Promise.all(apiTypes.map((apiType) => request(`${API_BASE}/${apiType}`)));
  return groups.flat();
}

async function saveEntry(entry) {
  const method = entry.filename ? 'PUT' : 'POST';
  const url = entry.filename
    ? `${API_BASE}/${entry.apiType}/${encodeURIComponent(entry.filename)}`
    : `${API_BASE}/${entry.apiType}`;

  return request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
}

async function deleteEntry(entry) {
  return request(`${API_BASE}/${entry.apiType}/${encodeURIComponent(entry.filename)}`, {
    method: 'DELETE'
  });
}

async function renderPreview(entry) {
  return request(`${API_BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: entry.apiType,
      entry
    })
  });
}

async function fetchTags() {
  return request(`${API_BASE}/meta/tags`);
}

async function fetchImages() {
  return request(`${API_BASE}/images`);
}

async function uploadImages(files) {
  const uploads = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append('image', file);
    uploads.push(request(`${API_BASE}/images/upload`, {
      method: 'POST',
      body: formData
    }));
  }

  return Promise.all(uploads);
}

export {
  fetchEntries,
  fetchImages,
  fetchTags,
  renderPreview,
  saveEntry,
  deleteEntry,
  uploadImages
};
