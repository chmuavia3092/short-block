import { BaseDetector } from './base-detector.js';
import { CONFIG } from '../../../config.js';

export class FacebookDetector extends BaseDetector {
  constructor() {
    super(CONFIG.PLATFORMS.FACEBOOK);
  }

  isShortContentUrl(url) {
    if (!url) return false;
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname.includes('/reels/')) return true;
    if (pathname.includes('/reel/')) return true;
    
    return false;
  }

  hasShortContentElements() {
    const reelElements = document.querySelectorAll(
      '[data-pagelet*="reel"], [role="article"]:has(video)'
    );
    
    return reelElements.length > 0;
  }

  blockReelsElements() {
    const selectors = [
      '[data-pagelet*="reel"]',
      '[role="article"]:has(video)',
      '[data-testid="reel"]',
      'div:has(> div > div > video)[role="feed"] > div'
    ];
    
    for (const selector of selectors) {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          if (!el.dataset.focusGuardBlocked) {
            el.dataset.focusGuardBlocked = 'true';
            el.style.display = 'none';
          }
        });
      } catch {
        // :has() may not be supported
      }
    }
  }
}
