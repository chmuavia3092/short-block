import { CONFIG } from '../../config.js';
import { formatRelativeTime } from '../utils/format.js';
import { escapeHtml, sanitizeUrl } from '../utils/sanitize.js';
const API_KEY = CONFIG.NEWS_API_KEY;
const API_BASE = CONFIG.NEWS_API_BASE;

const FALLBACK_ARTICLES = [
  {
    title: 'AI Focus Guard - Built-in Research',
    description: 'NewsAPI key not configured. Showing sample AI research topics.',
    source: { name: 'Local' },
    url: 'https://huggingface.co',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Latest AI Models Directory',
    description: 'Explore cutting-edge open source AI models on Hugging Face.',
    source: { name: 'Hugging Face' },
    url: 'https://huggingface.co/models',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'OpenAI releases new tools',
    description: 'Latest updates on GPT and developer tools from OpenAI.',
    source: { name: 'OpenAI' },
    url: 'https://openai.com/blog',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'Machine Learning Crash Course',
    description: 'Free interactive ML course by Google.',
    source: { name: 'Google' },
    url: 'https://developers.google.com/machine-learning/crash-course',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'ArXiv - Latest AI Papers',
    description: 'Browse the latest research papers in artificial intelligence.',
    source: { name: 'ArXiv' },
    url: 'https://arxiv.org/list/cs.AI/recent',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  },
  {
    title: 'AI Startups Funding Landscape',
    description: 'Track the latest AI startup funding and investments.',
    source: { name: 'Crunchbase' },
    url: 'https://www.crunchbase.com/hub/ai-startups/',
    urlToImage: '',
    publishedAt: new Date().toISOString()
  }
];

class ResearchPage {
  constructor() {
    this.currentSection = 'news';
    this.currentCategory = 'ai-news';
    this.currentQuery = '';
    this.currentPage = 1;
    this.totalResults = 0;
    this.bookmarks = [];
    this.newsCache = {};
    
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadBookmarks();
    await this.loadNews();
  }

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.addEventListener('click', () => this.switchSection(btn.dataset.section));
    });

    document.querySelectorAll('.category-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.loadCategory(btn.dataset.category));
    });

    document.querySelectorAll('.suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        document.getElementById('search-input').value = chip.dataset.query;
        this.performSearch(chip.dataset.query);
      });
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      const query = document.getElementById('search-input').value.trim();
      if (query) this.performSearch(query);
    });

    document.getElementById('search-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = e.target.value.trim();
        if (query) this.performSearch(query);
      }
    });

    document.getElementById('btn-refresh').addEventListener('click', () => {
      this.loadNews(true);
    });

    const apiKeyBtn = document.getElementById('btn-api-key');
    if (apiKeyBtn) {
      apiKeyBtn.addEventListener('click', () => this.promptLangSearchApiKey());
    }

    document.getElementById('btn-back').addEventListener('click', () => {
      window.history.back();
    });

    document.getElementById('back-to-news').addEventListener('click', () => {
      this.switchSection('news');
    });

    document.getElementById('load-more-btn').addEventListener('click', () => {
      this.loadMore();
    });

    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.performSearch(this.currentQuery, false);
      }
    });

    document.getElementById('next-page').addEventListener('click', () => {
      this.currentPage++;
      this.performSearch(this.currentQuery, false);
    });
  }

  switchSection(section) {
    this.currentSection = section;
    
    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.section === section);
    });
    
    document.getElementById('news-section').style.display = section === 'news' ? 'block' : 'none';
    document.getElementById('search-results-section').style.display = section === 'search' ? 'block' : 'none';
    document.getElementById('bookmarks-section').style.display = section === 'bookmarks' ? 'block' : 'none';
    
    if (section === 'bookmarks') {
      this.renderBookmarks();
    }
  }

  async loadCategory(category) {
    this.currentCategory = category;
    
    document.querySelectorAll('.category-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    const titles = {
      'ai-news': 'Trending AI News',
      'coding-agents': 'AI Coding Agents',
      'llm': 'Large Language Models',
      'open-source': 'Open Source AI',
      'dev-tools': 'Developer Tools',
      'ai-startups': 'AI Startups'
    };
    
    document.getElementById('section-title').textContent = titles[category] || 'AI News';
    await this.fetchNewsByCategory(category);
  }

  async fetchNewsByCategory(category, forceRefresh = false) {
    const cacheKey = `category_${category}`;
    if (!forceRefresh && this.newsCache[cacheKey]) {
      this.renderNews(this.newsCache[cacheKey]);
      return;
    }
    
    this.showSkeleton();
    
    const queries = {
      'ai-news': 'artificial intelligence',
      'coding-agents': 'coding agents AI assistant',
      'llm': 'large language model GPT Claude',
      'open-source': 'open source AI models',
      'dev-tools': 'developer tools AI',
      'ai-startups': 'AI startup funding'
    };
    
    const query = queries[category] || 'artificial intelligence';
    
    try {
      const articles = await this.fetchHeadlines(query);
      this.newsCache[cacheKey] = articles;
      this.renderNews(articles);
      this.updateLastUpdated();
    } catch (error) {
      console.error('Error fetching news:', error);
      this.showError('Failed to load news. Please try again.');
    }
  }

  async loadNews(forceRefresh = false) {
    await this.fetchNewsByCategory(this.currentCategory, forceRefresh);
  }

  async promptLangSearchApiKey() {
    const current = await this.getLangSearchApiKey();
    const entered = window.prompt('Enter your LangSearch API key:', current || '');
    if (entered === null) return;
    const key = entered.trim();
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({ langSearchApiKey: key }, resolve);
      });
      alert(key ? 'LangSearch API key saved.' : 'LangSearch API key cleared.');
    } catch (e) {
      alert('Failed to save API key: ' + (e && e.message ? e.message : e));
    }
  }

  async fetchHeadlines(query) {
    const params = new URLSearchParams({
      q: query,
      language: 'en',
      pageSize: CONFIG.ITEMS_PER_PAGE.toString(),
      apiKey: API_KEY
    });
    
       const response = await fetch(`${API_BASE}/top-headlines?${params}`);

      if (!response.ok) {
        if (response.status === 401 || response.status === 429 || response.status === 426) {
          return FALLBACK_ARTICLES;
        }
        throw new Error(`API error: ${response.status}`);
      }
    
    const data = await response.json();
    
    if (!data.articles) return [];
    
    return data.articles
      .filter((article) => article.title && article.title !== '[Removed]')
      .map((article) => this.sanitizeArticle(article));
  }

  async performSearch(query, resetPage = true) {
    if (resetPage) {
      this.currentPage = 1;
    }

    this.currentQuery = query;
    this.switchSection('search');

    document.getElementById('search-results-title').textContent = `Results for "${query}"`;
    this.showSearchSkeleton();

    try {
      const apiKey = await this.getLangSearchApiKey();
      if (!apiKey) {
        this.renderSearchResults([]);
        const grid = document.getElementById('search-results-grid');
        grid.innerHTML = '<p class="empty-state">LangSearch API key not configured. Click "Set API Key" or add it to config.js (LANGSEARCH_API_KEY).</p>';
        return;
      }

      const count = CONFIG.ITEMS_PER_PAGE;
      const response = await fetch(CONFIG.LANGSEARCH_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          query: query,
          count: count,
          contents: { text: true }
        })
      });

      if (!response.ok) {
        throw new Error(`LangSearch API error: ${response.status}`);
      }

      const data = await response.json();
      const results = (data.data && data.data.webPages && data.data.webPages.value)
        ? data.data.webPages.value
        : [];

      if (!results.length) {
        this.renderSearchResults([]);
        return;
      }

      const mapped = results.map((r) => ({
        title: r.name || r.title || '',
        url: r.url || '',
        description: (r.text || r.snippet || '')
      }));

      this.totalResults = mapped.length;
      this.renderLangSearchResults(mapped);
      this.updatePagination();
    } catch (error) {
      console.error('Search error:', error);
      const grid = document.getElementById('search-results-grid');
      grid.innerHTML = `<p class="empty-state">Search failed: ${escapeHtml(error.message || 'Please try again.')}</p>`;
    }
  }

  async getLangSearchApiKey() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await new Promise((resolve) => {
          chrome.storage.local.get('langSearchApiKey', (result) => {
            resolve(result && result.langSearchApiKey);
          });
        });
        if (stored) return stored;
      }
    } catch (e) {
      // Ignore and fall back to config
    }
    return (CONFIG.LANGSEARCH_API_KEY || '').trim();
  }

  renderLangSearchResults(results) {
    const grid = document.getElementById('search-results-grid');
    if (!results || !results.length) {
      grid.innerHTML = '<p class="empty-state">No results found. Try a different search term.</p>';
      return;
    }
    grid.innerHTML = results.map((r) => this.createLangSearchResultCard(r)).join('');
  }

  createLangSearchResultCard(result) {
    const safeUrl = sanitizeUrl(result.url);
    return `
      <article class="news-card" data-url="${escapeHtml(safeUrl)}">
        <div class="news-content">
          <h3 class="news-title">
            <a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(result.title)}</a>
          </h3>
          <p class="news-summary">${escapeHtml(result.description)}</p>
          <div class="news-meta">
            <span class="news-date">${escapeHtml(safeUrl)}</span>
            <div class="news-actions">
              <a class="read-more-btn" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">Open</a>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  renderNews(articles) {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = articles.map((article) => this.createNewsCard(article)).join('');
  }

  renderSearchResults(articles) {
    const grid = document.getElementById('search-results-grid');
    
    if (articles.length === 0) {
      grid.innerHTML = '<p class="empty-state">No results found. Try a different search term.</p>';
      return;
    }
    
    grid.innerHTML = articles.map((article) => this.createNewsCard(article)).join('');
  }

  createNewsCard(article) {
    const isBookmarked = this.bookmarks.includes(article.url);
    const timeAgo = formatRelativeTime(article.publishedAt);

    return `
      <article class="news-card" data-url="${escapeHtml(article.url)}">
        ${article.urlToImage ? `<img class="news-image" src="${escapeHtml(article.urlToImage)}" alt="" loading="lazy" onerror="this.style.display='none'">` : ''}
        <div class="news-content">
          <span class="news-source">${escapeHtml(article.source)}</span>
          <h3 class="news-title">${escapeHtml(article.title)}</h3>
          <p class="news-summary">${escapeHtml(article.description)}</p>
          <div class="news-meta">
            <span class="news-date">${timeAgo}</span>
            <div class="news-actions">
              <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" data-url="${escapeHtml(article.url)}" title="Bookmark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
              <button class="read-more-btn" data-url="${escapeHtml(article.url)}">Read More</button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  showSkeleton() {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  }

  showSearchSkeleton() {
    const grid = document.getElementById('search-results-grid');
    grid.innerHTML = `
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
      <div class="skeleton-card"></div>
    `;
  }

  showError(message) {
    const grid = document.getElementById('news-grid');
    grid.innerHTML = `<p class="empty-state">${message}</p>`;
  }

  updateLastUpdated() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    document.getElementById('last-updated').textContent = `Updated ${timeStr}`;
  }

  updatePagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(this.totalResults / CONFIG.ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }
    
    pagination.style.display = 'flex';
    document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = this.currentPage <= 1;
    document.getElementById('next-page').disabled = this.currentPage >= totalPages;
  }

  async loadBookmarks() {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_BOOKMARKS' }, resolve);
      });
      this.bookmarks = response?.bookmarks || [];
    } catch {
      this.bookmarks = [];
    }
  }

  async toggleBookmark(url) {
    if (this.bookmarks.includes(url)) {
      this.bookmarks = this.bookmarks.filter((b) => b !== url);
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'REMOVE_BOOKMARK', url }, resolve);
      });
    } else {
      this.bookmarks.push(url);
      await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'ADD_BOOKMARK', url }, resolve);
      });
    }
    
    document.querySelectorAll(`[data-url="${CSS.escape(url)}"].bookmark-btn`).forEach((btn) => {
      btn.classList.toggle('active', this.bookmarks.includes(url));
      const svg = btn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', this.bookmarks.includes(url) ? 'currentColor' : 'none');
      }
    });
  }

  renderBookmarks() {
    const list = document.getElementById('bookmarks-list');

    if (this.bookmarks.length === 0) {
      list.innerHTML = '<p class="empty-state">No bookmarks yet. Save articles to read later.</p>';
      return;
    }

    list.innerHTML = this.bookmarks.map((url) => `
      <div class="bookmark-item">
        <div class="bookmark-info">
          <div class="bookmark-title">${escapeHtml(url)}</div>
          <div class="bookmark-url">${escapeHtml(url)}</div>
        </div>
        <div class="bookmark-actions">
          <button class="read-more-btn" data-url="${escapeHtml(url)}">Open</button>
          <button class="bookmark-btn active" data-url="${escapeHtml(url)}" title="Remove bookmark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
    
    list.querySelectorAll('.read-more-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.open(btn.dataset.url, '_blank');
      });
    });
    
    list.querySelectorAll('.bookmark-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await this.toggleBookmark(btn.dataset.url);
        this.renderBookmarks();
      });
    });
  }

  loadMore() {
    this.fetchNewsByCategory(this.currentCategory, true);
  }

  sanitizeArticle(article) {
    return {
      title: article.title || '',
      description: article.description || '',
      source: article.source?.name || '',
      url: article.url || '',
      urlToImage: article.urlToImage || '',
      publishedAt: article.publishedAt || null
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.researchPage = new ResearchPage();
});

document.addEventListener('click', (e) => {
  const readMoreBtn = e.target.closest('.read-more-btn');
  if (readMoreBtn) {
    const url = readMoreBtn.dataset.url;
    if (url) window.open(url, '_blank');
  }
  
  const bookmarkBtn = e.target.closest('.bookmark-btn');
  if (bookmarkBtn && window.researchPage) {
    const url = bookmarkBtn.dataset.url;
    if (url) window.researchPage.toggleBookmark(url);
  }
});
