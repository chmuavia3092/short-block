import { CONFIG } from '../../config.js';
import { escapeHtml } from '../utils/sanitize.js';

const SYSTEM_PROMPT = `You are a focused productivity coach. You help users understand the psychology of distractions, build discipline, improve focus, and adopt practical productivity techniques. Keep answers concise, actionable, and encouraging. Avoid off-topic content.`;

const WELCOME_MESSAGE = `Welcome! I’m glad you’re here.
I’m here to gently support you with focus, discipline, and understanding distractions.
How can I help you today?`;

const FOOTER_MESSAGE = `———
Made with care by M. Muavia Ibrahim
Feel free to contact us: 03435322326
You can also check out another project: https://pendooroots-site.vercel.app/
Thank you for using this tool.`;

class ChatPage {
  constructor() {
    this.history = [{ role: 'system', content: SYSTEM_PROMPT }];
    this.init();
  }

  async init() {
    this.bindEvents();
    await this.applyTheme();
    await this.loadApiKey();
  }

  async applyTheme() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await new Promise((resolve) => {
          chrome.storage.local.get('darkMode', (result) => resolve(result || {}));
        });
        document.documentElement.dataset.theme = stored.darkMode ? 'dark' : 'light';
      }
    } catch (e) {}
  }

  bindEvents() {
    const sendBtn = document.getElementById('chat-send');
    const input = document.getElementById('chat-input');
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendMessage());
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    }

    const clearBtn = document.getElementById('btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearChat());
    }

    const keyBtn = document.getElementById('btn-api-key');
    if (keyBtn) {
      keyBtn.addEventListener('click', () => this.promptApiKey());
    }
  }

  async loadApiKey() {
    this.apiKey = await this.getApiKey();
  }

  async getApiKey() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const stored = await new Promise((resolve) => {
          chrome.storage.local.get('groqApiKey', (result) => {
            resolve(result && result.groqApiKey);
          });
        });
        if (stored) return stored.trim();
      }
    } catch (e) {
      // ignore
    }
    return (CONFIG.GROQ_API_KEY || '').trim();
  }

  async promptApiKey() {
    const current = await this.getApiKey();
    const entered = window.prompt('Enter your Groq API key:', current || '');
    if (entered === null) return;
    const key = entered.trim();
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({ groqApiKey: key }, resolve);
      });
      this.apiKey = key;
      alert(key ? 'Groq API key saved.' : 'Groq API key cleared.');
    } catch (e) {
      alert('Failed to save API key: ' + (e && e.message ? e.message : e));
    }
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const text = (input?.value || '').trim();
    if (!text) return;

    this.appendMessage('user', text);
    if (input) input.value = '';

    const apiKey = this.apiKey || (await this.getApiKey());
    this.apiKey = apiKey;

    if (!apiKey) {
      this.appendMessage('assistant', 'Groq API key not configured. Click the key icon or set GROQ_API_KEY in config.js.');
      return;
    }

    const sendBtn = document.getElementById('chat-send');
    const status = document.getElementById('chat-status');
    if (sendBtn) sendBtn.disabled = true;
    if (status) status.textContent = 'Thinking...';

    this.history.push({ role: 'user', content: text });

    try {
      const response = await fetch(CONFIG.GROQ_API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: CONFIG.GROQ_MODEL || 'qwen/qwen3.8-27b',
          messages: this.history,
          temperature: 0.7,
          max_tokens: 1024
        })
      });

      if (!response.ok) {
        let msg = `API error: ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error?.message) msg = errData.error.message;
        } catch (e) {}
        throw new Error(msg);
      }

      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content || 'No response.';
      this.history.push({ role: 'assistant', content: reply });
      this.appendMessage('assistant', reply);
      this.appendFooter();
    } catch (error) {
      console.error('Chat error:', error);
      this.appendMessage('assistant', `Error: ${error.message || 'Please try again.'}`);
      // remove last user message from history to allow retry? keep it
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (status) status.textContent = '';
    }
  }

  appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `chat-message ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  appendFooter() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-message footer';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble footer-bubble';
    bubble.textContent = FOOTER_MESSAGE;
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  clearChat() {
    this.history = [{ role: 'system', content: SYSTEM_PROMPT }];
    const container = document.getElementById('chat-messages');
    if (container) {
      container.innerHTML = '';
      this.appendMessage('assistant', 'Conversation cleared. How can I help you focus?');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ChatPage();
});
