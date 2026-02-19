// Utility Functions
const Utils = {
  // Format timestamp
  formatTime(date) {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  },

  // Convert URLs to clickable links
  linkify(text) {
    const escaped = this.escapeHtml(text);
    return escaped.replace(/(https?:\/\/[^\s<>"]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  },

  // Generate random avatar color from nickname
  avatarColor(nickname) {
    const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63','#00bcd4','#ff5722'];
    let hash = 0;
    for (let c of (nickname || 'A')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  },

  // Get initials
  initials(nickname) {
    if (!nickname) return '?';
    return nickname.substring(0, 2).toUpperCase();
  },

  // Show toast notification
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container') || (() => {
      const c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement('div');
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      padding: 12px 18px; border-radius: 10px; font-size: 14px; font-weight: 500;
      background: var(--card-bg, #1e1e2e); color: var(--text, #cdd6f4);
      border: 1px solid var(--border, #313244); box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      display: flex; align-items: center; gap: 10px; min-width: 260px; max-width: 380px;
      animation: slideInRight 0.3s ease; cursor: pointer;
    `;
    toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${this.escapeHtml(message)}</span>`;
    toast.onclick = () => toast.remove();
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease'; setTimeout(() => toast.remove(), 300); }, duration);
  },

  // Copy to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    }
  },

  // Debounce
  debounce(fn, delay) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  // Store/retrieve from localStorage
  store: {
    get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
    remove: (key) => { try { localStorage.removeItem(key); } catch {} }
  },

  // Theme
  getTheme() { return this.store.get('theme') || 'dark'; },
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.store.set('theme', theme);
  },
  initTheme() { this.setTheme(this.getTheme()); }
};

window.Utils = Utils;
