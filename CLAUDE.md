# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Focus Guard** - A Chrome Extension (Manifest V3) that blocks distracting short-form content (YouTube Shorts, Instagram Reels, Facebook Reels, TikTok) and redirects users to productive AI learning resources.

## Commands

### Development

- **Generate Icons**: Open `generate-icons.html` in browser → right-click canvas → save as PNG to `assets/icons/` (icon16.png, icon48.png, icon128.png)
- **Load Extension**: Chrome → `chrome://extensions/` → Developer mode → "Load unpacked" → select project folder
- **No build step required** - vanilla JS, ES6 modules

### Testing

No formal test suite. Test manually by:
1. Loading extension in Developer Mode
2. Visiting YouTube/Instagram/Facebook/TikTok
3. Verifying shorts/reels are blocked
4. Checking popup UI functionality
5. Opening research page (`src/pages/research.html`)

## Architecture

### High-Level Structure

```
react bit cli/
├── manifest.json           # Manifest V3 config
├── config.js               # Central configuration (API keys, platform patterns, selectors)
├── src/
│   ├── background/         # Service worker (event handling, storage, messaging)
│   ├── content/            # Content scripts & blockers (injected into pages)
│   ├── popup/              # Extension popup UI
│   ├── pages/              # Research page (full dashboard)
│   ├── services/           # Business logic services
│   ├── components/         # Reusable UI components
│   └── utils/              # Utility functions
└── assets/                 # Icons and static assets
```

### Key Components

| Component | Purpose |
|-----------|---------|
| `src/background/service-worker.js` | Central message handler, alarms, tab management, stats coordination |
| `src/content/blocker.js` | Main content blocker - detects short-form URLs, creates overlay, prevents interaction |
| `src/content/detectors/*.js` | Platform-specific detection logic (YouTube, Instagram, Facebook, TikTok) |
| `src/popup/popup.js` | Popup UI controller - tabs, toggles, timer, stats display |
| `src/pages/research.js` | Research dashboard - news fetching, search, bookmarks, categories |
| `src/services/storage.js` | Chrome Storage wrapper with typed getters/setters |
| `src/services/stats.js` | Statistics: blocks, focus time, goals, charts |
| `src/services/news-api.js` | NewsAPI.org integration |
| `src/services/ai.js` | AI research brief generation |

### Message Passing

Background ↔ Content/Popup/Pages communicate via `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`:

| Message Type | Direction | Purpose |
|--------------|-----------|---------|
| `GET_FOCUS_MODE` / `SET_FOCUS_MODE` | Popup → Background | Toggle focus mode |
| `GET_WEBSITES` / `SET_WEBSITE` | Popup → Background | Per-platform toggles |
| `BLOCK_RECORDED` | Content → Background | Increment block counters |
| `CHECK_BLOCKING` | Background → Content | Trigger re-check on navigation |
| `FOCUS_MODE_CHANGED` | Background → Content | Broadcast focus mode state |
| `OPEN_RESEARCH_PAGE` | Popup/Content → Background | Open research dashboard tab |
| `GET_BOOKMARKS` / `ADD_BOOKMARK` / `REMOVE_BOOKMARK` | Pages → Background | Bookmark management |

### Platform Detection

`config.js` defines platform configs with:
- `hostname` - domains to match
- `patterns` - URL path patterns (e.g., `/shorts/`, `/reels/`)
- `selectors` - DOM selectors for short-form elements

Content script (`blocker.js`) uses both URL pattern matching AND DOM element detection for robustness.

### Storage Keys

Defined in `config.js` under `STORAGE_KEYS`:
- `focusMode` - global on/off
- `websites` - per-platform toggles
- `blockedCount` - today/week/month/total
- `stats.daily` / `stats.weekly` / `stats.mostBlocked`
- `focusStart` - timestamp for active timer
- `focusSessions` - completed session history
- `bookmarks` - saved article URLs
- `dailyGoal` - target focus minutes (default 120)
- `darkMode`, `notifications`, `aiMode`, `globalMode`, `aiResearch`

## Configuration

### API Keys

`config.js`:
```javascript
export const CONFIG = {
  NEWS_API_KEY: '',  // Add your NewsAPI.org key here
  NEWS_API_BASE: 'https://newsapi.org/v2',
  // ...
};
```

Free tier: 100 requests/day. Results cached 30 minutes.

### Permissions

Manifest V3 permissions:
- `storage` - settings & stats
- `tabs` - tab navigation
- `scripting` - content script injection
- `webNavigation` - navigation detection
- `alarms` - scheduled checks
- `notifications` - focus reminders

Host permissions for YouTube, Instagram, Facebook, TikTok, NewsAPI, Bytez API.

## Development Patterns

### Content Script (IIFE)

`blocker.js` uses IIFE pattern to avoid polluting page scope:
```javascript
(function() {
  'use strict';
  // All logic inside
})();
```

### Async Storage

`StorageService` wraps `chrome.storage.local` in Promises for async/await usage.

### Error Handling

Background message handler wraps all cases in try/catch, responds with `{ error: message }`.

### Platform-Specific Blocking

`blocker.js` → `blockSpecificElements(platform)` hides platform-specific selectors and pauses all videos.

### Navigation Detection

- `history.pushState`/`replaceState` overridden
- `popstate`/`hashchange` listeners
- `MutationObserver` on `document.body`
- Service worker alarm checks active tab every minute

## Chrome Web Store Deployment

1. Create ZIP of extension folder
2. Go to Chrome Web Store Developer Dashboard
3. Upload ZIP
4. Fill store listing
5. Submit for review

### Pre-submission Checklist
- [ ] All icons are PNG format (16, 48, 128)
- [ ] No hardcoded API keys in public repo (`config.js` has empty `NEWS_API_KEY`)
- [ ] Permissions are justified
- [ ] Screenshots and description ready
- [ ] Privacy policy created

## License

MIT