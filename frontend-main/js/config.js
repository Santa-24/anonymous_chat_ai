// Frontend Configuration
const CONFIG = {
  // Backend URL (auto switch local / production)
  BACKEND_URL: (() => {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://localhost:3000';
    }

    // 🔥 Render backend (PRODUCTION)
    return 'https://anonymous-chat-ai.onrender.com';
  })(),

  // Socket.IO options (REQUIRED for Vercel + Render)
  SOCKET_OPTIONS: {
    transports: ['websocket'], // ⭐ CRITICAL
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  },

  MAX_MESSAGE_LENGTH: 2000,
  TYPING_TIMEOUT: 1500,
};

// Make available globally
window.CONFIG = CONFIG;
