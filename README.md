# AI Focus Guard

A Chrome Extension that blocks distracting short-form content and redirects you to productive AI learning.

## Features

- **Shorts Blocker** - Detects and blocks YouTube Shorts, Instagram Reels, Facebook Reels, and TikTok
- **Productive Research** - AI news feed and search powered by NewsAPI
- **Focus Statistics** - Track blocked distractions and focus time
- **Premium UI** - Apple-inspired glassmorphism design
- **Dark Mode** - Easy on the eyes for late-night sessions

## Installation

### From Source (Developer Mode)

1. **Generate Icons**
   - Open `generate-icons.html` in your browser
   - Right-click each canvas and save as PNG to `assets/icons/`
   - Name them `icon16.png`, `icon48.png`, `icon128.png`

2. **Load Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select this project folder

3. **Pin Extension**
   - Click the puzzle icon in Chrome toolbar
   - Pin "AI Focus Guard"

## Usage

### Blocking Distractions

1. Click the extension icon
2. Toggle "Focus Mode" on
3. Visit YouTube, Instagram, Facebook, or TikTok
4. Shorts/Reels content will be automatically blocked

### Research Dashboard

1. Click the extension icon
2. Click "Productive Research"
3. Browse AI news or search for topics
4. Bookmark articles for later

### Settings

- Enable/disable specific platforms
- Toggle notifications
- Set daily focus goals
- Reset statistics

## Architecture

```
ai-focus-guard/
├── manifest.json           # Manifest V3 configuration
├── config.js               # API keys and constants
├── src/
│   ├── background/         # Service worker
│   ├── content/            # Content scripts & blockers
│   ├── popup/              # Extension popup UI
│   ├── pages/              # Research page
│   ├── services/           # Business logic services
│   ├── components/         # Reusable UI components
│   └── utils/              # Utility functions
└── assets/                 # Icons and static assets
```

## Tech Stack

- Manifest V3
- Vanilla JavaScript (ES6 Modules)
- Chrome Storage API
- NewsAPI.org
- No external frameworks

## API Integration

This extension uses NewsAPI.org for fetching news articles.

**API Key Location:** `config.js`

```javascript
export const CONFIG = {
  NEWS_API_KEY: 'your-api-key-here',
  NEWS_API_BASE: 'https://newsapi.org/v2'
};
```

### Rate Limits

- Free tier: 100 requests/day
- Results cached for 30 minutes

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save settings and statistics |
| `tabs` | Manage tab navigation |
| `scripting` | Inject content scripts |
| `webNavigation` | Detect page navigation |
| `alarms` | Schedule notifications |
| `notifications` | Show focus reminders |

## Security

- No inline JavaScript
- All API responses sanitized
- XSS prevention on user data
- Least privilege permissions

## Development

### Project Structure

- **Content Scripts** - Detect and block short-form content
- **Service Worker** - Background tasks and message handling
- **Popup** - Quick access controls
- **Research Page** - Full AI news dashboard

### Key Files

- `config.js` - Central configuration
- `src/services/storage.js` - Chrome Storage wrapper
- `src/content/blocker.js` - Main content blocker
- `src/pages/research.js` - Research page logic

## Chrome Web Store Deployment

1. Create ZIP of extension folder
2. Go to Chrome Web Store Developer Dashboard
3. Upload ZIP
4. Fill in store listing
5. Submit for review

### Checklist

- [ ] All icons are PNG format
- [ ] No hardcoded API keys in public repo
- [ ] Permissions are justified
- [ ] Screenshots and description ready
- [ ] Privacy policy created

## License

MIT
