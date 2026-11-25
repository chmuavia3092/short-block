import { CONFIG, STORAGE_KEYS, DEFAULT_SETTINGS } from '../../config.js';
import { StorageService } from '../services/storage.js';
import { BadgeService } from '../services/badge.js';
import { StatsService } from '../services/stats.js';
import { NotificationService } from '../services/notifications.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initializeExtension();
  }

  if (details.reason === 'update') {
    await handleUpdate();
  }
});

async function initializeExtension() {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await StorageService.get(key);
    if (existing === undefined) {
      await StorageService.set(key, value);
    }
  }

  await BadgeService.init();
  await NotificationService.init();

  console.log('AI Focus Guard installed successfully');
}

async function handleUpdate() {
  await BadgeService.init();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true;
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.type) {
      case 'GET_FOCUS_MODE':
      case 'GET_EXTENSION_ACTIVE':
      case 'GET_GLOBAL_MODE': {
        const mode = await StorageService.getFocusMode();
        await StorageService.updateSetting('globalMode', mode);
        sendResponse({ enabled: mode, active: mode });
        break;
      }

      case 'SET_FOCUS_MODE':
      case 'SET_EXTENSION_ACTIVE':
      case 'SET_GLOBAL_MODE': {
        await StorageService.setFocusMode(message.enabled);
        await StorageService.updateSetting('globalMode', message.enabled);
        await BadgeService.updateBadge();

        if (message.enabled) {
          await StatsService.startFocusTimer();
        } else {
          const minutes = await StatsService.stopFocusTimer();
          if (minutes > 0) {
            await StatsService.addFocusSession(minutes);
          }
        }

        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'FOCUS_MODE_CHANGED',
              enabled: message.enabled
            }).catch(() => {});
            chrome.tabs.sendMessage(tab.id, {
              type: 'EXTENSION_ACTIVE_CHANGED',
              enabled: message.enabled
            }).catch(() => {});
          });
        });

        sendResponse({ success: true });
        break;
      }

      case 'GET_WEBSITES': {
        const sites = await StorageService.getWebsiteSettings();
        sendResponse({ websites: sites });
        break;
      }

      case 'SET_WEBSITE': {
        await StorageService.setWebsiteSetting(message.platform, message.enabled);
        sendResponse({ success: true });
        break;
      }

      case 'GET_BLOCKED_COUNT': {
        const count = await StorageService.getBlockedCount();
        sendResponse({ count });
        break;
      }

      case 'GET_STATS': {
        const stats = await StatsService.getDailyStats();
        sendResponse({ stats });
        break;
      }

      case 'GET_WEEKLY_STATS': {
        const weekly = await StatsService.getWeeklyStats();
        sendResponse({ weekly });
        break;
      }

      case 'GET_MOST_BLOCKED': {
        const mostBlocked = await StatsService.getMostBlockedSite();
        sendResponse({ mostBlocked });
        break;
      }

      case 'GET_FOCUS_TIME': {
        const time = await StatsService.getFocusTime();
        sendResponse({ minutes: time });
        break;
      }

      case 'GET_DAILY_FOCUS_TIME': {
        const time = await StatsService.getDailyFocusTime();
        sendResponse({ minutes: time });
        break;
      }

      case 'ADD_FOCUS_SESSION': {
        await StatsService.addFocusSession(message.minutes);
        sendResponse({ success: true });
        break;
      }

      case 'GET_DAILY_GOAL_PROGRESS': {
        const progress = await StatsService.getDailyGoalProgress();
        sendResponse({ progress });
        break;
      }

      case 'GET_ESTIMATED_HOURS': {
        const hours = await StatsService.getEstimatedHoursSaved();
        sendResponse({ hours });
        break;
      }

      case 'GET_CHART_DATA': {
        const chartData = await StatsService.getChartData();
        sendResponse({ chartData });
        break;
      }

      case 'BLOCK_RECORDED': {
        const count = await StatsService.recordBlock(message.data.platform);

        if (count.today % 25 === 0 && count.today > 0) {
          await NotificationService.showMilestoneNotification(count.today);
        }

        sendResponse({ count });
        break;
      }

      case 'OPEN_RESEARCH_PAGE': {
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/pages/research.html')
        });
        sendResponse({ success: true });
        break;
      }

      case 'OPEN_HISTORY_PAGE': {
        chrome.tabs.create({
          url: chrome.runtime.getURL('src/pages/history.html')
        });
        sendResponse({ success: true });
        break;
      }

      case 'GET_FOCUS_SESSIONS': {
        const sessions = await StorageService.get(STORAGE_KEYS.FOCUS_SESSIONS);
        sendResponse({ sessions: sessions || [] });
        break;
      }

      case 'GET_BOOKMARKS': {
        const bookmarks = await StorageService.getBookmarks();
        sendResponse({ bookmarks });
        break;
      }

      case 'ADD_BOOKMARK': {
        const updated = await StorageService.addBookmark(message.url);
        sendResponse({ bookmarks: updated });
        break;
      }

      case 'REMOVE_BOOKMARK': {
        const updated = await StorageService.removeBookmark(message.url);
        sendResponse({ bookmarks: updated });
        break;
      }

      case 'GET_SETTINGS': {
        const settings = await StorageService.getSettings();
        sendResponse({ settings });
        break;
      }

      case 'GET_SETTING': {
        const value = await StorageService.get(message.key);
        sendResponse({ value });
        break;
      }

      case 'UNBLOCK_EXTENSION': {
        sendResponse({ success: true });
        break;
      }

      case 'UPDATE_SETTING': {
        await StorageService.updateSetting(message.key, message.value);
        sendResponse({ success: true });
        break;
      }

      case 'RESET_STATS': {
        await StorageService.set(STORAGE_KEYS.BLOCKED_COUNT, {
          today: 0,
          week: 0,
          month: 0,
          total: 0
        });
        await StorageService.set(STORAGE_KEYS.STATS, {
          daily: {},
          weekly: {},
          mostBlocked: {}
        });
        await BadgeService.updateBadgeCount(0);
        sendResponse({ success: true });
        break;
      }

      case 'START_FOCUS_TIMER': {
        await StatsService.startFocusTimer();
        sendResponse({ success: true });
        break;
      }

      case 'STOP_FOCUS_TIMER': {
        const minutes = await StatsService.stopFocusTimer();
        if (minutes > 0) {
          await StatsService.addFocusSession(minutes);
        }
        sendResponse({ minutes });
        break;
      }

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
}

chrome.runtime.onStartup.addListener(async () => {
  try {
    await BadgeService.init();
  } catch (e) {
    console.error('Startup init error:', e);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'check-navigation') {
    await checkNavigationState();
  }
});

async function checkNavigationState() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  for (const tab of tabs) {
    if (tab.url) {
      try {
        const url = new URL(tab.url);
        const hostname = url.hostname.replace('www.', '');

        const isShort = url.pathname.includes('/shorts/') ||
                        url.pathname.includes('/reels/') ||
                        url.pathname.includes('/video/');

        if (isShort) {
          chrome.tabs.sendMessage(tab.id, { type: 'CHECK_BLOCKING' }).catch(() => {});
        }
      } catch {
        // Invalid URL
      }
    }
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const focusMode = await StorageService.getFocusMode();
    const globalMode = await StorageService.get('globalMode');
    if (focusMode && globalMode !== false) {
      try {
        chrome.tabs.sendMessage(tabId, { type: 'CHECK_BLOCKING' }).catch(() => {});
      } catch {
        // Content script not loaded
      }
    }
  }
});