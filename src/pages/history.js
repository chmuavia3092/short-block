import { CONFIG } from '../../config.js';

class HistoryPage {
  constructor() {
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadHistory();
  }

  bindEvents() {
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadHistory());
    }
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response);
      });
    });
  }

  async loadHistory() {
    try {
      const focusResponse = await this.sendMessage({ type: 'GET_DAILY_FOCUS_TIME' });
      const focusMinutes = focusResponse?.minutes || 0;

      const blockedResponse = await this.sendMessage({ type: 'GET_BLOCKED_COUNT' });
      const blocked = blockedResponse?.count?.today ?? 0;

      const sessionsResponse = await this.sendMessage({ type: 'GET_FOCUS_SESSIONS' });
      const allSessions = sessionsResponse?.sessions || [];
      const todayKey = new Date().toISOString().slice(0, 10);
      const todaySessions = allSessions.filter((s) => s.date === todayKey);

      const goalResponse = await this.sendMessage({ type: 'GET_SETTING', key: 'dailyGoal' });
      const dailyGoal = goalResponse?.value || 120;
      const goalPercent = Math.min(Math.round((focusMinutes / dailyGoal) * 100), 100);

      this.renderSummary(focusMinutes, blocked, todaySessions.length, goalPercent);
      this.renderTimeline(todaySessions);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  renderSummary(focusMinutes, blocked, sessionsCount, goalPercent) {
    const focusEl = document.getElementById('stat-focus-time');
    const blockedEl = document.getElementById('stat-blocked');
    const sessionsEl = document.getElementById('stat-sessions');
    const goalEl = document.getElementById('stat-goal');

    const hours = Math.floor(focusMinutes / 60);
    const mins = focusMinutes % 60;
    if (focusEl) focusEl.textContent = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    if (blockedEl) blockedEl.textContent = blocked;
    if (sessionsEl) sessionsEl.textContent = sessionsCount;
    if (goalEl) goalEl.textContent = `${goalPercent}%`;
  }

  renderTimeline(sessions) {
    const container = document.getElementById('timeline');
    if (!container) return;

    if (!sessions || !sessions.length) {
      container.innerHTML = '<p class="empty-state">No focus sessions recorded today.</p>';
      return;
    }

    container.innerHTML = sessions
      .slice()
      .reverse()
      .map((session) => {
        const duration = session.duration || 0;
        const endTs = session.timestamp || Date.now();
        const startTs = endTs - duration * 60 * 1000;
        const startTime = new Date(startTs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        const endTime = new Date(endTs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

        const h = Math.floor(duration / 60);
        const m = duration % 60;
        const durationText = h > 0 ? `${h}h ${m}m` : `${m}m`;

        return `
          <div class="timeline-item">
            <span class="timeline-time">${startTime} – ${endTime}</span>
            <span class="timeline-duration">${durationText}</span>
          </div>
        `;
      })
      .join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HistoryPage();
});
