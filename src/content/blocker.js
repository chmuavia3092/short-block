(function () {
  'use strict';

  var STORAGE_KEYS = {
    FOCUS_MODE: 'focusMode',
    WEBSITES: 'websites'
  };

  function isShortContentUrl(url) {
    try {
      var u = new URL(url);
      var p = u.pathname;
      if (u.hostname.indexOf('youtube.com') !== -1) return p.indexOf('/shorts/') !== -1;
      if (u.hostname.indexOf('instagram.com') !== -1) return p.indexOf('/reels/') !== -1 || p.indexOf('/reel/') !== -1;
      if (u.hostname.indexOf('facebook.com') !== -1) return p.indexOf('/reels/') !== -1 || p.indexOf('/reel/') !== -1;
      if (u.hostname.indexOf('tiktok.com') !== -1) return p.indexOf('/video/') !== -1;
    } catch (e) {}
    return false;
  }

  function hasShortContentElements() {
    try {
      if (document.querySelector('ytd-shorts')) return true;
      var reelIframe = document.querySelector('[data-testid="reel"]');
      if (reelIframe) return true;
      var fbReel = document.querySelector('[data-pagelet*="reel"]');
      if (fbReel) return true;
      var ttFeed = document.querySelector('[data-e2e="video-feed"]');
      if (ttFeed) return true;
    } catch (e) {}
    return false;
  }

  function detectPlatform() {
    var h = window.location.hostname.replace('www.', '');
    if (h.indexOf('youtube') !== -1) return 'youtube';
    if (h.indexOf('instagram') !== -1) return 'instagram';
    if (h.indexOf('facebook') !== -1) return 'facebook';
    if (h.indexOf('tiktok') !== -1) return 'tiktok';
    return null;
  }

  function createBlockingOverlay() {
    if (document.getElementById('focus-guard-overlay')) return;
    var overlay = document.createElement('div');
    overlay.id = 'focus-guard-overlay';
    overlay.className = 'focus-guard-overlay';
    overlay.innerHTML = '<div class="focus-guard-content">' +
      '<div class="focus-guard-icon"><svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="32" cy="32" r="30" stroke="#533afd" stroke-width="2" fill="none"/><path d="M20 20L44 44M44 20L20 44" stroke="#533afd" stroke-width="3" stroke-linecap="round"/></svg></div>' +
      '<h1 class="focus-guard-title">Blocked</h1>' +
      '<p class="focus-guard-message">This content has been blocked to protect your focus.</p>' +
      '<p class="focus-guard-motivation">Stay focused.<br>Build something meaningful today.</p>' +
      '<div class="focus-guard-actions">' +
      '<button class="focus-guard-btn focus-guard-btn-primary" id="focus-guard-research">Productive Research</button>' +
      '<button class="focus-guard-btn focus-guard-btn-secondary" id="focus-guard-dismiss">Go Back</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.getElementById('focus-guard-research').addEventListener('click', function () {
      chrome.runtime.sendMessage({ type: 'OPEN_RESEARCH_PAGE' });
    });
    document.getElementById('focus-guard-dismiss').addEventListener('click', function () {
      window.history.back();
    });
    return overlay;
  }

  function removeBlockingOverlay() {
    var el = document.getElementById('focus-guard-overlay');
    if (el) el.remove();
  }

  function preventInteraction() {
    var events = ['keydown', 'keypress', 'keyup', 'mousedown', 'mouseup', 'click', 'touchstart', 'touchend'];
    function handler(e) {
      if (e.target.closest('.focus-guard-overlay')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      return false;
    }
    events.forEach(function (ev) { document.addEventListener(ev, handler, true); });
    return function () {
      events.forEach(function (ev) { document.removeEventListener(ev, handler, true); });
    };
  }

  function preventAutoplay() {
    document.querySelectorAll('video').forEach(function (v) {
      v.pause();
      v.removeAttribute('autoplay');
      v.src = '';
    });
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.tagName === 'VIDEO') {
            n.pause();
            n.removeAttribute('autoplay');
            n.src = '';
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return observer;
  }

  function preventScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    function handler(e) {
      e.preventDefault();
      return false;
    }
    document.addEventListener('wheel', handler, { passive: false });
    document.addEventListener('touchmove', handler, { passive: false });
    return function () {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.removeEventListener('wheel', handler);
      document.removeEventListener('touchmove', handler);
    };
  }

  function blockSpecificElements(platform) {
    var selectors = [];
    if (platform === 'youtube') selectors = ['ytd-shorts', 'ytd-reel-shelf-renderer'];
    if (platform === 'instagram') selectors = ['[data-testid="reel"]'];
    if (platform === 'facebook') selectors = ['[data-pagelet*="reel"]'];
    if (platform === 'tiktok') selectors = ['[data-e2e="video-feed"]'];
    selectors.forEach(function (s) {
      try {
        document.querySelectorAll(s).forEach(function (el) {
          el.style.display = 'none';
        });
      } catch (e) {}
    });
    document.querySelectorAll('video').forEach(function (v) {
      v.pause();
      v.src = '';
    });
  }

  var state = {
    isBlocking: false,
    cleanups: [],
    autoplayObserver: null
  };

  function isEnabled() {
    return new Promise(function (resolve) {
      chrome.storage.local.get([STORAGE_KEYS.FOCUS_MODE, STORAGE_KEYS.WEBSITES], function (result) {
        var focusMode = result[STORAGE_KEYS.FOCUS_MODE] !== false;
        var platforms = result[STORAGE_KEYS.WEBSITES] || {
          youtube: true, instagram: true, facebook: true, tiktok: true
        };
        var platform = detectPlatform();
        resolve(focusMode && (platform ? platforms[platform] !== false : true));
      });
    });
  }

  function shouldBlock() {
    var platform = detectPlatform();
    if (!platform) return false;
    return isShortContentUrl(window.location.href) || hasShortContentElements();
  }

  function block() {
    if (state.isBlocking) return;
    state.isBlocking = true;
    createBlockingOverlay();
    state.cleanups.push(preventInteraction());
    state.cleanups.push(preventScroll());
    state.autoplayObserver = preventAutoplay();
    var platform = detectPlatform();
    if (platform) blockSpecificElements(platform);
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'BLOCK_RECORDED',
        data: { platform: platform }
      });
    }
  }

  function unblock() {
    if (!state.isBlocking) return;
    state.isBlocking = false;
    removeBlockingOverlay();
    state.cleanups.forEach(function (fn) {
      try { fn(); } catch (e) {}
    });
    state.cleanups = [];
    if (state.autoplayObserver) {
      state.autoplayObserver.disconnect();
      state.autoplayObserver = null;
    }
  }

  var scheduled = false;
  function scheduleCheck() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () {
      scheduled = false;
      runCheck();
    }, 300);
  }

  function runCheck() {
    isEnabled().then(function (enabled) {
      if (!enabled) {
        unblock();
        return;
      }
      if (shouldBlock()) {
        block();
      }
    }).catch(function () {});
  }

  function startObserving() {
    runCheck();

    var origPush = history.pushState;
    var origReplace = history.replaceState;
    history.pushState = function () {
      origPush.apply(history, arguments);
      scheduleCheck();
    };
    history.replaceState = function () {
      origReplace.apply(history, arguments);
      scheduleCheck();
    };

    window.addEventListener('popstate', runCheck);
    window.addEventListener('hashchange', scheduleCheck);

    var observer = new MutationObserver(function () {
      scheduleCheck();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  chrome.runtime.onMessage.addListener(function (message) {
    if (message.type === 'FOCUS_MODE_CHANGED') {
      if (message.enabled) {
        startObserving();
      } else {
        unblock();
      }
    }
    if (message.type === 'CHECK_BLOCKING') {
      runCheck();
    }
  });

  startObserving();
})();
