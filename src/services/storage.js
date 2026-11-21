import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../config.js';

export const StorageService = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  },

  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  },

  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(key, resolve);
    });
  },

  async getSettings() {
    const settings = await this.getAll();
    return { ...DEFAULT_SETTINGS, ...settings };
  },

  async updateSetting(key, value) {
    await this.set(key, value);
  },

  async getFocusMode() {
    const mode = await this.get(STORAGE_KEYS.FOCUS_MODE);
    return mode !== undefined ? mode : DEFAULT_SETTINGS[STORAGE_KEYS.FOCUS_MODE];
  },

  async setFocusMode(enabled) {
    await this.set(STORAGE_KEYS.FOCUS_MODE, enabled);
  },

  async getWebsiteSettings() {
    const sites = await this.get(STORAGE_KEYS.WEBSITES);
    return sites || DEFAULT_SETTINGS[STORAGE_KEYS.WEBSITES];
  },

  async setWebsiteSetting(platform, enabled) {
    const sites = await this.getWebsiteSettings();
    sites[platform] = enabled;
    await this.set(STORAGE_KEYS.WEBSITES, sites);
  },

  async getBlockedCount() {
    const count = await this.get(STORAGE_KEYS.BLOCKED_COUNT);
    return count || DEFAULT_SETTINGS[STORAGE_KEYS.BLOCKED_COUNT];
  },

  async incrementBlockedCount(platform) {
    const count = await this.getBlockedCount();
    count.today += 1;
    count.week += 1;
    count.month += 1;
    count.total += 1;
    await this.set(STORAGE_KEYS.BLOCKED_COUNT, count);
    
    const stats = await this.get(STORAGE_KEYS.STATS) || DEFAULT_SETTINGS[STORAGE_KEYS.STATS];
    stats.mostBlocked[platform] = (stats.mostBlocked[platform] || 0) + 1;
    await this.set(STORAGE_KEYS.STATS, stats);
    
    return count;
  },

  async resetDailyCount() {
    const count = await this.getBlockedCount();
    count.today = 0;
    await this.set(STORAGE_KEYS.BLOCKED_COUNT, count);
  },

  async getBookmarks() {
    const bookmarks = await this.get(STORAGE_KEYS.BOOKMARKS);
    return bookmarks || [];
  },

  async addBookmark(url) {
    const bookmarks = await this.getBookmarks();
    if (!bookmarks.includes(url)) {
      bookmarks.push(url);
      await this.set(STORAGE_KEYS.BOOKMARKS, bookmarks);
    }
    return bookmarks;
  },

  async removeBookmark(url) {
    let bookmarks = await this.getBookmarks();
    bookmarks = bookmarks.filter((b) => b !== url);
    await this.set(STORAGE_KEYS.BOOKMARKS, bookmarks);
    return bookmarks;
  },

  async initDailyReset() {
    const lastReset = await this.get(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toDateString();
    
    if (lastReset !== today) {
      const count = await this.getBlockedCount();
      const stats = await this.get(STORAGE_KEYS.STATS) || DEFAULT_SETTINGS[STORAGE_KEYS.STATS];
      
      const dayKey = new Date().toISOString().slice(0, 10);
      stats.daily[dayKey] = count.today;
      
      await this.resetDailyCount();
      await this.set(STORAGE_KEYS.LAST_RESET, today);
      await this.set(STORAGE_KEYS.STATS, stats);
    }
  }
};
