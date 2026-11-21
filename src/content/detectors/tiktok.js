import { BaseDetector } from './base-detector.js';
import { CONFIG } from '../../../config.js';

export class TikTokDetector extends BaseDetector {
  constructor() {
    super(CONFIG.PLATFORMS.TIKTOK);
  }

  isShortContentUrl(url) {
    if (!url) return false;
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname.includes('/video/')) return true;
    if (pathname.includes('/@') && !pathname.includes('/video/')) {
      return false;
    }
    
    return false;
  }

  hasShortContentElements() {
    const videoFeed = document.querySelector('[data-e2e="video-feed"]');
    const videoContainer = document.querySelector('.tiktok-y6j3un');
    const playerContainer = document.querySelector('[data-e2e="video-player"]');
    
    return !!(videoFeed || videoContainer || playerContainer);
  }

  blockVideoElements() {
    const selectors = [
      '[data-e2e="video-feed"]',
      '[data-e2e="video-player"]',
      '.tiktok-y6j3un',
      '[class*="DivItemContainer"]'
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
        // Selector may not match
      }
    }
  }
}
