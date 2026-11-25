export const CONFIG = {
  NEWS_API_KEY: '',
  NEWS_API_BASE: 'https://newsapi.org/v2',

  LANGSEARCH_API_KEY: '',
  LANGSEARCH_API_BASE: 'https://api.langsearch.com/v1/web-search',

  GROQ_API_KEY: '',
  GROQ_API_BASE: 'https://api.groq.com/openai/v1/chat/completions',
  GROQ_MODEL: 'qwen/qwen3.8-27b',
  
  DEFAULT_CATEGORIES: [
    'Artificial Intelligence',
    'Machine Learning',
    'LLM',
    'Coding Agents',
    'AI Tools',
    'Open Source AI'
  ],
  
  ITEMS_PER_PAGE: 10,
  CACHE_TTL: 30 * 60 * 1000,
  
  PLATFORMS: {
    YOUTUBE: {
      name: 'YouTube',
      hostname: ['www.youtube.com', 'youtube.com'],
      patterns: ['/shorts/'],
      selectors: ['ytd-shorts', 'ytd-reel-shelf-renderer', 'ytd-rich-grid-row']
    },
    INSTAGRAM: {
      name: 'Instagram',
      hostname: ['instagram.com', 'www.instagram.com'],
      patterns: ['/reels/'],
      selectors: ['[data-testid="reel"]', '._aatb']
    },
    FACEBOOK: {
      name: 'Facebook',
      hostname: ['www.facebook.com', 'facebook.com'],
      patterns: ['/reels/'],
      selectors: ['[data-pagelet*="reel"]', '[role="feed"]']
    },
    TIKTOK: {
      name: 'TikTok',
      hostname: ['www.tiktok.com', 'tiktok.com'],
      patterns: ['/video/'],
      selectors: ['[data-e2e="video-feed"]', '.tiktok-y6j3un']
    }
  },
  
  NOTIFICATION_MESSAGES: {
    FOCUS_REMINDER: [
      'Stay focused. You are building something great.',
      'Keep going. Every minute of focus counts.',
      'Distraction is the enemy of progress.',
      'Your future self will thank you for this focus.'
    ],
    MILESTONE: [
      'Amazing! You blocked {count} distractions today.',
      'Incredible focus! {count} distractions avoided.',
      'You are on fire! {count} blocks and counting.'
    ],
    DAILY_GOAL: 'You reached your daily focus goal of {goal} minutes!'
  },
  
  STATS: {
    AVG_SHORT_DURATION: 30,
    FOCUS_MULTIPLIER: 2
  }
};

export const STORAGE_KEYS = {
  FOCUS_MODE: 'focusMode',
  WEBSITES: 'websites',
  DARK_MODE: 'darkMode',
  NOTIFICATIONS: 'notifications',
  DAILY_GOAL: 'dailyGoal',
  BLOCKED_COUNT: 'blockedCount',
  BOOKMARKS: 'bookmarks',
  LAST_RESET: 'lastReset',
  FOCUS_START: 'focusStart',
  STATS: 'stats',
  AI_RESEARCH: 'aiResearch',
  AI_MODE: 'aiMode',
  GLOBAL_MODE: 'globalMode',
  FOCUS_SESSIONS: 'focusSessions',
}; 

export const DEFAULT_SETTINGS = {
  [STORAGE_KEYS.FOCUS_MODE]: true,
  [STORAGE_KEYS.WEBSITES]: {
    youtube: true,
    instagram: true,
    facebook: true,
    tiktok: true
  },
  [STORAGE_KEYS.DARK_MODE]: false,
  [STORAGE_KEYS.NOTIFICATIONS]: true,
  [STORAGE_KEYS.DAILY_GOAL]: 120,
  [STORAGE_KEYS.AI_RESEARCH]: true,
  [STORAGE_KEYS.AI_MODE]: 'active',
  [STORAGE_KEYS.GLOBAL_MODE]: true,
  [STORAGE_KEYS.BLOCKED_COUNT]: {
    today: 0,
    week: 0,
    month: 0,
    total: 0
  },
  [STORAGE_KEYS.BOOKMARKS]: [],
  [STORAGE_KEYS.LAST_RESET]: null,
  [STORAGE_KEYS.FOCUS_START]: null,
  [STORAGE_KEYS.STATS]: {
    daily: {},
    weekly: {},
    mostBlocked: {}
  }
};
