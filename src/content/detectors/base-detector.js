import { CONFIG } from '../../../config.js';

export class BaseDetector {
  constructor(platformConfig) {
    this.config = platformConfig;
    this.observer = null;
    this.isBlocking = false;
  }

  isShortContentUrl(url) {
    if (!url) return false;
    
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const pathname = urlObj.pathname;
    
    if (!this.config.hostname.some((h) => hostname === h.replace('www.', ''))) {
      return false;
    }
    
    return this.config.patterns.some((pattern) => pathname.includes(pattern));
  }

  hasShortContentElements() {
    return this.config.selectors.some((selector) => {
      try {
        return document.querySelector(selector) !== null;
      } catch {
        return false;
      }
    });
  }

  startObserving(callback) {
    if (this.observer) return;
    
    this.observer = new MutationObserver(
      debounceMutations((mutations) => {
        if (this.isShortContentUrl(window.location.href) || this.hasShortContentElements()) {
          callback();
        }
      }, 150)
    );
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  destroy() {
    this.stopObserving();
    this.isBlocking = false;
  }
}

function debounceMutations(callback, delay) {
  let timeoutId = null;
  let pendingNodes = new Set();
  
  return function (mutations) {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            pendingNodes.add(node);
          }
        }
      }
    }
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      const nodes = Array.from(pendingNodes);
      pendingNodes.clear();
      timeoutId = null;
      if (nodes.length > 0) {
        callback(nodes);
      }
    }, delay);
  };
}
