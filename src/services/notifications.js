import { CONFIG, STORAGE_KEYS, DEFAULT_SETTINGS } from '../../config.js';
import { StorageService } from './storage.js';

export const NotificationService = {
  async init() {
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'focus-reminder') {
        this.showFocusReminder();
      }
      if (alarm.name === 'daily-reset') {
        this.handleDailyReset();
      }
    });
    
    const notificationsEnabled = await StorageService.get(STORAGE_KEYS.NOTIFICATIONS);
    if (notificationsEnabled) {
      await this.scheduleReminders();
    }
  },

  async scheduleReminders() {
    await chrome.alarms.clear('focus-reminder');
    
    chrome.alarms.create('focus-reminder', {
      delayInMinutes: 60,
      periodInMinutes: 60
    });
    
    chrome.alarms.create('daily-reset', {
      when: this.getNextMidnight(),
      periodInMinutes: 24 * 60
    });
  },

  async cancelReminders() {
    await chrome.alarms.clear('focus-reminder');
    await chrome.alarms.clear('daily-reset');
  },

  getNextMidnight() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime();
  },

  async showFocusReminder() {
    const enabled = await StorageService.get(STORAGE_KEYS.NOTIFICATIONS);
    if (!enabled) return;
    
    const messages = CONFIG.NOTIFICATION_MESSAGES.FOCUS_REMINDER;
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    this.showNotification('AI Focus Guard', message);
  },

  async showMilestoneNotification(count) {
    const messages = CONFIG.NOTIFICATION_MESSAGES.MILESTONE;
    const template = messages[Math.floor(Math.random() * messages.length)];
    const message = template.replace('{count}', count.toString());
    
    this.showNotification('Milestone Reached!', message);
  },

  async showGoalNotification(goal) {
    const message = CONFIG.NOTIFICATION_MESSAGES.DAILY_GOAL.replace('{goal}', goal.toString());
    this.showNotification('Goal Achieved!', message);
  },

  showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/icons/icon128.png',
      title,
      message,
      priority: 0
    });
  },

  async handleDailyReset() {
    const lastReset = await StorageService.get(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toDateString();

    if (lastReset !== today) {
      const count = await StorageService.getBlockedCount();
      const stats = await StorageService.get(STORAGE_KEYS.STATS) || DEFAULT_SETTINGS[STORAGE_KEYS.STATS];

      const dayKey = new Date().toISOString().slice(0, 10);
      stats.daily[dayKey] = count.today;

      const countData = await StorageService.getBlockedCount();
      countData.today = 0;
      await StorageService.set(STORAGE_KEYS.BLOCKED_COUNT, countData);
      await StorageService.set(STORAGE_KEYS.LAST_RESET, today);
      await StorageService.set(STORAGE_KEYS.STATS, stats);
    }
  }
};
