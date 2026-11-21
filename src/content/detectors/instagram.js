import { BaseDetector } from './base-detector.js';
import { CONFIG } from '../../../config.js';

export class InstagramDetector extends BaseDetector {
  constructor() {
    super(CONFIG.PLATFORMS.INSTAGRAM);
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
      '[data-testid="reel"], ._aatb, [role="tabpanel"]'
    );
    
    for (const el of reelElements) {
      if (el.querySelector('video') || el.querySelector('[data-testid="reel-video-container"]')) {
        return true;
      }
    }
    
    return false;
  }

  blockReelsElements() {
    const selectors = [
      '[data-testid="reel"]',
      '._aatb',
      '[role="tabpanel"]:has(video)',
      'article:has(a[href*="/reel/"])'
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
