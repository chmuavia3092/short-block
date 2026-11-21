const OVERLAY_ID = 'focus-guard-overlay';

export function createBlockingOverlay() {
  if (document.getElementById(OVERLAY_ID)) return;
  
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'focus-guard-overlay';
  
  overlay.innerHTML = `
    <div class="focus-guard-content">
      <div class="focus-guard-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="30" stroke="#533afd" stroke-width="2" fill="none"/>
          <path d="M20 20L44 44M44 20L20 44" stroke="#533afd" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 class="focus-guard-title">Blocked</h1>
      <p class="focus-guard-message">
        This content has been blocked to protect your focus.
      </p>
      <p class="focus-guard-motivation">
        Stay focused.<br>Build something meaningful today.
      </p>
      <div class="focus-guard-actions">
        <button class="focus-guard-btn focus-guard-btn-primary" id="focus-guard-research">
          Productive Research
        </button>
        <button class="focus-guard-btn focus-guard-btn-secondary" id="focus-guard-dismiss">
          Go Back
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  document.getElementById('focus-guard-research').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_RESEARCH_PAGE' });
  });
  
  document.getElementById('focus-guard-dismiss').addEventListener('click', () => {
    window.history.back();
  });
  
  return overlay;
}

export function removeBlockingOverlay() {
  const overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}

export function preventInteraction() {
  const events = ['keydown', 'keypress', 'keyup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
  
  const handler = (e) => {
    if (e.target.closest('.focus-guard-overlay')) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  };
  
  events.forEach((event) => {
    document.addEventListener(event, handler, true);
  });
  
  return () => {
    events.forEach((event) => {
      document.removeEventListener(event, handler, true);
    });
  };
}

export function preventAutoplay() {
  const videos = document.querySelectorAll('video');
  videos.forEach((video) => {
    video.pause();
    video.removeAttribute('autoplay');
    video.src = '';
  });
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'VIDEO') {
          node.pause();
          node.removeAttribute('autoplay');
          node.src = '';
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  return observer;
}

export function preventScroll() {
  document.body.style.overflow = 'hidden';
  document.documentElement.style.overflow = 'hidden';
  
  const handler = (e) => {
    e.preventDefault();
    return false;
  };
  
  document.addEventListener('wheel', handler, { passive: false });
  document.addEventListener('touchmove', handler, { passive: false });
  
  return () => {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.removeEventListener('wheel', handler);
    document.removeEventListener('touchmove', handler);
  };
}
