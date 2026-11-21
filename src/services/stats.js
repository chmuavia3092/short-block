import { CONFIG, STORAGE_KEYS } from '../../config.js';
import { StorageService } from './storage.js';
import { getDayOfWeek, getWeekNumber, getMonthKey } from '../utils/format.js';

export const StatsService = {
  async recordBlock(platform) {
    const count = await StorageService.incrementBlockedCount(platform);

    chrome.runtime.sendMessage({
      type: 'BLOCK_RECORDED',
      data: { platform, count }
    });

    return count;
  },

  async getDailyStats() {
    const stats = await StorageService.get(STORAGE_KEYS.STATS) || {};
    const daily = stats.daily || {};

    const today = new Date().toISOString().slice(0, 10);
    const count = await StorageService.getBlockedCount();

    return {
      today: count.today,
      yesterday: daily[getYesterdayKey()] || 0,
      thisWeek: count.week,
      thisMonth: count.month,
      total: count.total
    };
  },

  async getWeeklyStats() {
    const stats = await StorageService.get(STORAGE_KEYS.STATS) || {};
    const daily = stats.daily || {};

    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      weekData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: daily[key] || 0
      });
    }

    return weekData;
  },

  async getMostBlockedSite() {
    const stats = await StorageService.get(STORAGE_KEYS.STATS) || {};
    const mostBlocked = stats.mostBlocked || {};

    let maxCount = 0;
    let topSite = null;

    for (const [site, count] of Object.entries(mostBlocked)) {
      if (count > maxCount) {
        maxCount = count;
        topSite = site;
      }
    }

    return { site: topSite, count: maxCount };
  },

  async getFocusTime() {
    const focusStart = await StorageService.get(STORAGE_KEYS.FOCUS_START);

    if (!focusStart) return 0;

    const elapsed = Math.floor((Date.now() - focusStart) / 60000);
    return elapsed;
  },

  async startFocusTimer() {
    await StorageService.set(STORAGE_KEYS.FOCUS_START, Date.now());
  },

  async stopFocusTimer() {
    const start = await StorageService.get(STORAGE_KEYS.FOCUS_START);
    if (!start) return 0;

    const elapsed = Math.floor((Date.now() - start) / 60000);
    await StorageService.set(STORAGE_KEYS.FOCUS_START, null);

    return elapsed;
  },

  async getEstimatedHoursSaved() {
    const count = await StorageService.getBlockedCount();
    const totalBlocks = count.total;
    const avgDuration = CONFIG.STATS.AVG_SHORT_DURATION;
    const totalSeconds = totalBlocks * avgDuration;
    return Math.round(totalSeconds / 3600 * 10) / 10;
  },

  async getChartData() {
    const weekly = await this.getWeeklyStats();
    const maxVal = Math.max(...weekly.map((d) => d.count), 1);

    return weekly.map((d) => ({
      ...d,
      height: (d.count / maxVal) * 100
    }));
  },

  async getDailyFocusTime() {
    const focusStart = await StorageService.get(STORAGE_KEYS.FOCUS_START);
    const sessions = await StorageService.get(STORAGE_KEYS.FOCUS_SESSIONS) || [];
    const today = new Date().toISOString().slice(0, 10);

    let totalMinutes = sessions
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    if (focusStart) {
      const currentSessionMinutes = Math.floor((Date.now() - focusStart) / 60000);
      totalMinutes += currentSessionMinutes;
    }

    return totalMinutes;
  },

  async addFocusSession(minutes) {
    const sessions = await StorageService.get(STORAGE_KEYS.FOCUS_SESSIONS) || [];
    const today = new Date().toISOString().slice(0, 10);

    sessions.push({
      date: today,
      duration: minutes,
      timestamp: Date.now()
    });

    await StorageService.set(STORAGE_KEYS.FOCUS_SESSIONS, sessions);
  },

  async getDailyGoalProgress() {
    const dailyGoal = await StorageService.get(STORAGE_KEYS.DAILY_GOAL) || 120;
    const focusTime = await this.getDailyFocusTime();

    return {
      current: focusTime,
      goal: dailyGoal,
      percentage: Math.min((focusTime / dailyGoal) * 100, 100)
    };
  }
};

function getYesterdayKey() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}