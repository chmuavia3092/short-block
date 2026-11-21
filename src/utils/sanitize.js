const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return String(str).replace(/[&<>"'`=/]/g, (s) => ENTITY_MAP[s]);
}

export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return '';
    }
  }
  return '';
}

export function sanitizeNewsItem(item) {
  return {
    title: escapeHtml(item.title || ''),
    description: escapeHtml(item.description || ''),
    source: escapeHtml(item.source?.name || ''),
    url: sanitizeUrl(item.url || ''),
    urlToImage: sanitizeUrl(item.urlToImage || ''),
    publishedAt: item.publishedAt || null,
    author: escapeHtml(item.author || '')
  };
}

export function sanitizeSearchResult(result) {
  return {
    title: escapeHtml(result.title || ''),
    snippet: escapeHtml(result.snippet || result.description || ''),
    url: sanitizeUrl(result.url || ''),
    source: escapeHtml(result.source || ''),
    publishedAt: result.publishedAt || null
  };
}
