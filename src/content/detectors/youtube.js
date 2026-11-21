import { BaseDetector } from './base-detector.js';
import { CONFIG } from '../../../config.js';

export class YouTubeDetector extends BaseDetector {
  constructor() {
    super(CONFIG.PLATFORMS.YOUTUBE);
  }

  isShortContentUrl(url) {
    if (!url) return false;
    
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    if (pathname.startsWith('/shorts/')) return true;
    
    if (pathname === '/watch') {
      const params = urlObj.searchParams;
      const list = params.get('list');
      if (list && list.startsWith('PL') === false) {
        const ref = params.get('ref');
        if (ref === 'shorts' || ref === 'shorts-trending') return true;
      }
    }
    
    return false;
  }

  hasShortContentElements() {
    const shortsShelf = document.querySelector('ytd-reel-shelf-renderer');
    const shortsContainer = document.querySelector('ytd-shorts');
    const richGrid = document.querySelector('ytd-rich-grid-row');
    
    if (shortsShelf || shortsContainer) return true;
    
    if (richGrid) {
      const items = richGrid.querySelectorAll('ytd-rich-item-renderer');
      for (const item of items) {
        if (item.querySelector('a[href*="/shorts/"]')) return true;
      }
    }
    
    return false;
  }

  blockShortsElements() {
    const selectors = [
      'ytd-reel-shelf-renderer',
      'ytd-shorts',
      'ytd-rich-item-renderer:has(a[href*="/shorts/"])',
      'ytd-video-renderer:has(a[href*="/shorts/"])'
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
        // :has() may not be supported in all contexts
      }
    }
  }
}
