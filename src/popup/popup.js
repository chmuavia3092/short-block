import { AIService } from '../services/ai.js';
import { formatMinutes } from '../utils/format.js';
import { escapeHtml } from '../utils/sanitize.js';

class PopupController {
  constructor() {
    this.init();
  }

  sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  async init() {
    this.bindEvents();
    await this.loadData();
  }

  bindEvents() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById('focus-toggle').addEventListener('change', (e) => {
      this.toggleFocusMode(e.target.checked);
    });

    document.getElementById('btn-research').addEventListener('click', () => {
      this.openResearchPage();
    });

    const aiResearchBtn = document.getElementById('btn-ai-research');
    if (aiResearchBtn) {
      aiResearchBtn.addEventListener('click', () => this.generateResearchBrief());
    }

    const aiModeToggle = document.getElementById('ai-mode-toggle');
    if (aiModeToggle) {
      aiModeToggle.addEventListener('change', () => this.toggleAIMode(aiModeToggle.checked));
      this.aiModeLabels = {
        active: aiModeToggle.parentElement?.querySelector('.ai-mode-text.active'),
        inactive: aiModeToggle.parentElement?.querySelectorAll('.ai-mode-text')[1]
      };
    }

    const globalToggle = document.getElementById('global-mode-toggle');
    if (globalToggle) {
      globalToggle.addEventListener('change', () => this.toggleGlobalMode(globalToggle.checked));
    }

    document.getElementById('btn-open-research').addEventListener('click', () => {
      this.openResearchPage();
    });

    const openHistoryBtn = document.getElementById('btn-open-history');
    if (openHistoryBtn) {
      openHistoryBtn.addEventListener('click', () => this.openHistoryPage());
    }

    const openChatBtn = document.getElementById('btn-open-chat');
    if (openChatBtn) {
      openChatBtn.addEventListener('click', () => this.openChatPage());
    }

    document.getElementById('btn-reset-stats').addEventListener('click', () => {
      this.resetStats();
    });

    document.querySelectorAll('.website-toggle').forEach((toggle) => {
      toggle.addEventListener('change', (e) => {
        this.toggleWebsite(e.target.dataset.platform, e.target.checked);
      });
    });

    document.getElementById('notifications-toggle').addEventListener('change', (e) => {
      this.toggleNotifications(e.target.checked);
    });

    document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
      this.toggleDarkMode(e.target.checked);
    });
  }

  async loadData() {
    await this.loadFocusMode();
    await this.loadStats();
    await this.loadSettings();
    await this.loadChartData();
    await this.loadGlobalMode();
  }

  async loadFocusMode() {
    const response = await this.sendMessage({ type: 'GET_FOCUS_MODE' });
    const enabled = response.enabled !== false;
    const toggle = document.getElementById('focus-toggle');
    const badge = document.getElementById('focus-badge');
    const status = document.getElementById('toggle-status');

    if (toggle) toggle.checked = enabled;
    if (badge) {
      badge.textContent = enabled ? 'ON' : 'OFF';
      badge.classList.toggle('off', !enabled);
    }
    if (status) status.textContent = enabled ? 'Protecting your focus' : 'Focus mode disabled';

    const globalToggle = document.getElementById('global-mode-toggle');
    const globalStatus = document.getElementById('global-mode-status');
    if (globalToggle) globalToggle.checked = enabled;
    if (globalStatus) globalStatus.textContent = enabled ? 'Active' : 'Inactive';
  }

  async toggleFocusMode(enabled) {
    await this.sendMessage({ type: 'SET_FOCUS_MODE', enabled });
    await this.sendMessage({ type: 'UPDATE_SETTING', key: 'globalMode', value: enabled });
    await this.loadFocusMode();

    const timer = window.timerController;
    if (timer) {
      if (enabled) timer.startTimer();
      else timer.pauseTimer();
    }
  }

  async loadStats() {
    const statsResponse = await this.sendMessage({ type: 'GET_STATS' });
    const stats = statsResponse.stats;

    document.getElementById('stat-today').textContent = stats.today;
    document.getElementById('stat-week').textContent = stats.thisWeek;
    document.getElementById('stat-month').textContent = stats.thisMonth;
    document.getElementById('stat-total').textContent = stats.total;

    const focusResponse = await this.sendMessage({ type: 'GET_FOCUS_TIME' });
    document.getElementById('stat-focus-time').textContent = formatMinutes(focusResponse.minutes);

    const mostBlockedResponse = await this.sendMessage({ type: 'GET_MOST_BLOCKED' });
    const mostBlocked = mostBlockedResponse.mostBlocked;
    document.getElementById('stat-most-blocked').textContent = mostBlocked.site || 'None';

    const hoursResponse = await this.sendMessage({ type: 'GET_ESTIMATED_HOURS' });
    document.getElementById('stat-hours-saved').textContent = `${hoursResponse.hours}h`;
  }

  async loadChartData() {
    const response = await this.sendMessage({ type: 'GET_CHART_DATA' });
    const chartData = response.chartData;
    const chart = document.getElementById('weekly-chart');

    chart.innerHTML = chartData.map((day) => `
      <div class="bar-item">
        <div class="bar" style="height: ${Math.max(day.height, 2)}%"></div>
        <span class="bar-label">${day.day}</span>
      </div>
    `).join('');
  }

  async loadSettings() {
    const response = await this.sendMessage({ type: 'GET_SETTINGS' });
    const settings = response.settings;

    document.querySelectorAll('.website-toggle').forEach((toggle) => {
      const platform = toggle.dataset.platform;
      toggle.checked = settings.websites[platform] !== false;
    });

    document.getElementById('notifications-toggle').checked = settings.notifications !== false;
    document.getElementById('dark-mode-toggle').checked = settings.darkMode === true;

    const aiModeToggle = document.getElementById('ai-mode-toggle');
    if (aiModeToggle) {
      const aiMode = settings.aiMode !== 'inactive';
      aiModeToggle.checked = aiMode;
      if (this.aiModeLabels) {
        if (this.aiModeLabels.active) this.aiModeLabels.active.classList.toggle('active', aiMode);
        if (this.aiModeLabels.inactive) this.aiModeLabels.inactive.classList.toggle('active', !aiMode);
      }
      const btn = document.getElementById('btn-ai-research');
      if (btn) btn.disabled = !aiMode;
    }
  }

  async toggleWebsite(platform, enabled) {
    await this.sendMessage({
      type: 'SET_WEBSITE',
      platform,
      enabled
    });
  }

  async toggleNotifications(enabled) {
    await this.sendMessage({
      type: 'UPDATE_SETTING',
      key: 'notifications',
      value: enabled
    });
  }

  async toggleDarkMode(enabled) {
    await this.sendMessage({
      type: 'UPDATE_SETTING',
      key: 'darkMode',
      value: enabled
    });
  }

  async resetStats() {
    if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
      await this.sendMessage({ type: 'RESET_STATS' });
      await this.loadStats();
      await this.loadChartData();
    }
  }

  openResearchPage() {
    chrome.runtime.sendMessage({ type: 'OPEN_RESEARCH_PAGE' });
    window.close();
  }

  openHistoryPage() {
    chrome.runtime.sendMessage({ type: 'OPEN_HISTORY_PAGE' });
    window.close();
  }

  openChatPage() {
    chrome.runtime.sendMessage({ type: 'OPEN_CHAT_PAGE' });
    window.close();
  }

  switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });

    if (tabName === 'stats') {
      this.loadStats();
      this.loadChartData();
    }
  }

   async generateResearchBrief() {
    const btn = document.getElementById('btn-ai-research');
    const output = document.getElementById('ai-output');
    const textEl = document.getElementById('ai-tip-text');
    const topicInput = document.getElementById('ai-topic-input');

    const topic = topicInput ? topicInput.value.trim() : 'artificial intelligence';

    btn.disabled = true;
    btn.querySelector('.ai-btn-text').textContent = 'Researching...';

    try {
      const result = await AIService.getLiveResearchBrief(topic);
      const sources = (result.headlines || [])
        .map((h) => `<a href="${escapeHtml(h.url)}" target="_blank">${escapeHtml(h.title)}</a>`)
        .join('\n');
      const html = sources
        ? `<div class="ai-brief">${result.brief || ''}</div><div class="ai-sources"><b>Live Sources:</b>\n${sources}</div>`
        : result.brief || '';
      textEl.innerHTML = html;
      output.style.display = 'block';
    } catch (err) {
      textEl.textContent = 'Stay focused and build something meaningful today!';
      output.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.querySelector('.ai-btn-text').textContent = 'Generate Research Brief';
    }
  }

  async toggleAIMode(active) {
    await this.sendMessage({ type: 'UPDATE_SETTING', key: 'aiMode', value: active ? 'active' : 'inactive' });
    const activeLabel = this.aiModeLabels && this.aiModeLabels.active;
    const inactiveLabel = this.aiModeLabels && this.aiModeLabels.inactive;
    if (activeLabel) activeLabel.classList.toggle('active', active);
    if (inactiveLabel) inactiveLabel.classList.toggle('active', !active);
    const btn = document.getElementById('btn-ai-research');
    if (btn) btn.disabled = !active;
  }

  async toggleGlobalMode(enabled) {
    // Master Activate / Deactivate: drives blocking + tracking + badge
    await this.sendMessage({ type: 'SET_FOCUS_MODE', enabled });
    await this.sendMessage({ type: 'UPDATE_SETTING', key: 'globalMode', value: enabled });

    const badge = document.getElementById('focus-badge');
    if (badge) {
      badge.textContent = enabled ? 'ON' : 'OFF';
      badge.classList.toggle('off', !enabled);
    }

    const status = document.getElementById('toggle-status');
    if (status) status.textContent = enabled ? 'Protecting your focus' : 'Focus mode disabled';

    const focusToggle = document.getElementById('focus-toggle');
    if (focusToggle) focusToggle.checked = enabled;

    const globalStatus = document.getElementById('global-mode-status');
    if (globalStatus) globalStatus.textContent = enabled ? 'Active' : 'Inactive';

    if (!enabled) {
      this.unblockAllTabs();
    }

    const timer = window.timerController;
    if (timer) {
      if (enabled) timer.startTimer();
      else timer.pauseTimer();
    }
  }

  unblockAllTabs() {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { type: 'UNBLOCK_EXTENSION' }).catch(() => {});
      });
    });
  }

  async loadGlobalMode() {
    const response = await this.sendMessage({ type: 'GET_FOCUS_MODE' });
    const enabled = response.enabled !== false;

    await this.sendMessage({ type: 'UPDATE_SETTING', key: 'globalMode', value: enabled });

    const globalToggle = document.getElementById('global-mode-toggle');
    const row = document.querySelector('.global-mode-row');
    if (globalToggle) {
      globalToggle.checked = enabled;
      if (row) row.style.display = 'flex';

      const globalStatus = document.getElementById('global-mode-status');
      if (globalStatus) globalStatus.textContent = enabled ? 'Active' : 'Inactive';

      const badge = document.getElementById('focus-badge');
      if (badge) {
        badge.textContent = enabled ? 'ON' : 'OFF';
        badge.classList.toggle('off', !enabled);
      }
    }
  }
}

class TimerController {
  constructor(popupController) {
    this.popupController = popupController;
    this.timerInterval = null;
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.dailyGoal = 120 * 60; // 120 minutes in seconds
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadTimerState();
    if (this.isRunning) {
      this.timerInterval = setInterval(() => {
        this.elapsedSeconds++;
        this.updateDisplay();
        this.updateProgress();
      }, 1000);
    }
    this.updateDisplay();
  }

  bindEvents() {
    document.getElementById('timer-start').addEventListener('click', () => {
      const btn = document.getElementById('timer-start');
      if (btn.querySelector('span').textContent === 'Resume') {
        this.resumeTimer();
      } else {
        this.startTimer();
      }
    });
    document.getElementById('timer-pause').addEventListener('click', () => this.pauseTimer());
    document.getElementById('timer-reset').addEventListener('click', () => this.resetTimer());
  }

  async loadTimerState() {
    const response = await this.popupController.sendMessage({ type: 'GET_DAILY_FOCUS_TIME' });
    this.elapsedSeconds = (response.minutes || 0) * 60;
    this.isRunning = await this.checkIfTimerRunning();

    const settingsResponse = await this.popupController.sendMessage({ type: 'GET_SETTING', key: 'dailyGoal' });
    if (settingsResponse.value) {
      this.dailyGoal = settingsResponse.value * 60;
    }

    this.updateButtonStates();
    this.updateProgress();
  }

  async checkIfTimerRunning() {
    const response = await this.popupController.sendMessage({ type: 'GET_SETTING', key: 'focusStart' });
    return response.value !== null && response.value !== undefined;
  }

  startTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.popupController.sendMessage({ type: 'START_FOCUS_TIMER' });

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateDisplay();
      this.updateProgress();
    }, 1000);

    this.updateButtonStates();
  }

  pauseTimer() {
    if (!this.isRunning) return;

    this.isRunning = false;
    clearInterval(this.timerInterval);
    this.timerInterval = null;

    this.popupController.sendMessage({ type: 'STOP_FOCUS_TIMER' });
    this.updateButtonStates();
  }

  async resumeTimer() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.popupController.sendMessage({ type: 'START_FOCUS_TIMER' });

    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.updateDisplay();
      this.updateProgress();
    }, 1000);

    this.updateButtonStates();
  }

  async resetTimer() {
    this.pauseTimer();
    this.elapsedSeconds = 0;
    await this.popupController.sendMessage({ type: 'UPDATE_SETTING', key: 'focusStart', value: null });
    this.updateDisplay();
    this.updateProgress();
    this.updateButtonStates();
  }

  updateDisplay() {
    const display = document.getElementById('timer-display');
    if (!display) return;

    const hours = Math.floor(this.elapsedSeconds / 3600);
    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);
    const seconds = this.elapsedSeconds % 60;

    if (hours > 0) {
      display.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  updateProgress() {
    const fill = document.getElementById('timer-progress-fill');
    const text = document.getElementById('timer-progress-text');
    if (!fill || !text) return;

    const progressPercent = Math.min((this.elapsedSeconds / this.dailyGoal) * 100, 100);
    fill.style.width = `${progressPercent}%`;

    const elapsedMinutes = Math.floor(this.elapsedSeconds / 60);
    const goalMinutes = Math.floor(this.dailyGoal / 60);
    text.textContent = `${elapsedMinutes} / ${goalMinutes} min`;
  }

  updateButtonStates() {
    const startBtn = document.getElementById('timer-start');
    const pauseBtn = document.getElementById('timer-pause');
    const resetBtn = document.getElementById('timer-reset');

    if (this.isRunning) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
      resetBtn.style.display = 'inline-flex';
    } else if (this.elapsedSeconds > 0) {
      startBtn.style.display = 'inline-flex';
      startBtn.querySelector('span').textContent = 'Resume';
      pauseBtn.style.display = 'none';
      resetBtn.style.display = 'inline-flex';
    } else {
      startBtn.style.display = 'inline-flex';
      startBtn.querySelector('span').textContent = 'Start';
      pauseBtn.style.display = 'none';
      resetBtn.style.display = 'none';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const popupController = new PopupController();
  window.timerController = new TimerController(popupController);
});
