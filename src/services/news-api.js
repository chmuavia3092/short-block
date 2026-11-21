import { CONFIG } from '../../config.js';
import { sanitizeNewsItem, sanitizeSearchResult } from '../utils/sanitize.js';

const CACHE_PREFIX = 'news_cache_';

export const NewsApiService = {
  async fetchWithCache(url, cacheKey) {
    const cached = await this.getFromCache(cacheKey);
    if (cached) return cached;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    await this.saveToCache(cacheKey, data);
    return data;
  },

  async getFromCache(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(CACHE_PREFIX + key, (result) => {
        const cached = result[CACHE_PREFIX + key];
        if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL) {
          resolve(cached.data);
        } else {
          resolve(null);
        }
      });
    });
  },

  async saveToCache(key, data) {
    const cacheKey = CACHE_PREFIX + key;
    return new Promise((resolve) => {
      chrome.storage.local.set({
        [cacheKey]: { data, timestamp: Date.now() }
      }, resolve);
    });
  },

  async getTopHeadlines(category = 'artificial intelligence') {
    const params = new URLSearchParams({
      q: category,
      language: 'en',
      pageSize: CONFIG.ITEMS_PER_PAGE.toString(),
      apiKey: CONFIG.NEWS_API_KEY
    });
    
    const url = `${CONFIG.NEWS_API_BASE}/top-headlines?${params}`;
    const cacheKey = `headlines_${category}`;
    
    const data = await this.fetchWithCache(url, cacheKey);
    
    if (!data.articles) return [];
    
    return data.articles
      .filter((article) => article.title && article.title !== '[Removed]')
      .map(sanitizeNewsItem);
  },

  async searchNews(query, page = 1) {
    const params = new URLSearchParams({
      q: query,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: CONFIG.ITEMS_PER_PAGE.toString(),
      page: page.toString(),
      apiKey: CONFIG.NEWS_API_KEY
    });
    
    const url = `${CONFIG.NEWS_API_BASE}/everything?${params}`;
    const cacheKey = `search_${query}_${page}`;
    
    const data = await this.fetchWithCache(url, cacheKey);
    
    if (!data.articles) return { articles: [], totalResults: 0 };
    
    return {
      articles: data.articles
        .filter((article) => article.title && article.title !== '[Removed]')
        .map(sanitizeNewsItem),
      totalResults: data.totalResults || 0
    };
  },

  async getAINews() {
    const queries = [
      'artificial intelligence',
      'machine learning',
      'LLM',
      'AI tools'
    ];
    
    const results = await Promise.allSettled(
      queries.map((q) => this.getTopHeadlines(q))
    );
    
    const articles = results
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);
    
    const seen = new Set();
    return articles.filter((article) => {
      const key = article.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, CONFIG.ITEMS_PER_PAGE);
  },

  async getCodingAgentNews() {
    return this.getTopHeadlines('coding agents AI assistant');
  },

  async getDeveloperTools() {
    return this.getTopHeadlines('developer tools AI');
  },

  async getOpenSourceAI() {
    return this.getTopHeadlines('open source AI');
  }
};
