// Frontend Configuration
const CONFIG = {
  // Auto-detect backend URL
  BACKEND_URL: (() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3000`;
    }
    return window.location.origin;
  })(),
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  },
  GLOBAL_ADMIN_PASSWORD: 'admin123', // Change to match your .env
  MAX_MESSAGE_LENGTH: 2000,
  TYPING_TIMEOUT: 1500,
};

window.CONFIG = CONFIG;
