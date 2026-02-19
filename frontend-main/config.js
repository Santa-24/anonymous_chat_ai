const CONFIG = {
  BACKEND_URL: (() => {
    // Local development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://localhost:3000';
    }

    // Production backend (Render)
    return 'https://anonymous-chat-ai.onrender.com';
  })(),
};
