import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../../config.js';
import { StorageService } from './storage.js';

export const BadgeService = {
  async updateBadge() {
    const focusMode = await StorageService.getFocusMode();
    
    if (focusMode) {
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      chrome.action.setBadgeText({ text: 'ON' });
    } else {
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      chrome.action.setBadgeText({ text: 'OFF' });
    }
  },

  async updateBadgeCount(count) {
    const text = count > 0 ? count.toString() : '';
    chrome.action.setBadgeText({ text });
  },

  async init() {
    await this.updateBadge();
    
    const count = await StorageService.getBlockedCount();
    if (count.today > 0) {
      await this.updateBadgeCount(count.today);
    }
  }
};
