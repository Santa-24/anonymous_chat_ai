const CONFIG = {
  BACKEND_URL: (() => {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://localhost:3000';
    }
    return 'https://anonymous-chat-ai.onrender.com';
  })(),

  SOCKET_OPTIONS: {
    transports: ['websocket'], // REQUIRED for Vercel + Render
    reconnection: true,
    reconnectionAttempts: 5,
    timeout: 20000,
  },

  MAX_MESSAGE_LENGTH: 2000,
  TYPING_TIMEOUT: 1500,
};
