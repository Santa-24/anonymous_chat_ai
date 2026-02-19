// Home Page Logic
document.addEventListener('DOMContentLoaded', () => {
  Utils.initTheme();

  const themeToggle = document.getElementById('theme-toggle');
  const createForm = document.getElementById('create-form');
  const joinForm = document.getElementById('join-form');
  const tabCreate = document.getElementById('tab-create');
  const tabJoin = document.getElementById('tab-join');
  const createBtn = document.getElementById('create-btn');
  const joinBtn = document.getElementById('join-btn');
  const nicknameInput = document.getElementById('nickname');
  const joinRoomInput = document.getElementById('join-room-id');
  const joinNicknameInput = document.getElementById('join-nickname');
  const toggleAI = document.getElementById('toggle-ai');
  const adminPasswordInput = document.getElementById('admin-password');
  const joinAdminPwInput = document.getElementById('join-admin-password');

  // Animate hero text
  const heroWords = ['Anonymous.', 'Private.', 'Real-time.', 'Secure.'];
  let wordIdx = 0;
  const heroAccent = document.getElementById('hero-accent');
  if (heroAccent) {
    setInterval(() => {
      heroAccent.style.opacity = '0';
      setTimeout(() => {
        heroAccent.textContent = heroWords[wordIdx = (wordIdx + 1) % heroWords.length];
        heroAccent.style.opacity = '1';
      }, 300);
    }, 2500);
  }

  // Theme toggle
  themeToggle?.addEventListener('click', () => {
    const current = Utils.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    Utils.setTheme(next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
  themeToggle && (themeToggle.textContent = Utils.getTheme() === 'dark' ? '☀️' : '🌙');

  // Tabs
  tabCreate?.addEventListener('click', () => { switchTab('create'); });
  tabJoin?.addEventListener('click', () => { switchTab('join'); });

  function switchTab(tab) {
    if (tab === 'create') {
      createForm.style.display = 'flex';
      joinForm.style.display = 'none';
      tabCreate.classList.add('active');
      tabJoin.classList.remove('active');
    } else {
      createForm.style.display = 'none';
      joinForm.style.display = 'flex';
      tabCreate.classList.remove('active');
      tabJoin.classList.add('active');
    }
  }

  // Pre-fill join room from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const roomParam = urlParams.get('room');
  if (roomParam && joinRoomInput) {
    joinRoomInput.value = roomParam;
    switchTab('join');
  }

  // Only allow digits in room ID
  joinRoomInput?.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });

  // Create Room
  createBtn?.addEventListener('click', async () => {
    const nickname = nicknameInput?.value.trim();
    const enableAI = toggleAI?.checked || false;
    const adminPassword = adminPasswordInput?.value.trim();

    if (!nickname) return Utils.toast('Please enter a nickname.', 'error');
    if (nickname.length < 2) return Utils.toast('Nickname must be at least 2 characters.', 'error');
    if (nickname.length > 20) return Utils.toast('Nickname too long (max 20 chars).', 'error');

    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    // Store for room.js to pick up
    Utils.store.set('pendingRoom', {
      action: 'create',
      nickname,
      enableAI,
      adminPassword
    });

    window.location.href = 'room.html';
  });

  // Join Room
  joinBtn?.addEventListener('click', async () => {
    const roomId = joinRoomInput?.value.trim();
    const nickname = joinNicknameInput?.value.trim();
    const adminPassword = joinAdminPwInput?.value.trim();

    if (!roomId || roomId.length !== 6) return Utils.toast('Enter a valid 6-digit Room ID.', 'error');
    if (!nickname) return Utils.toast('Please enter a nickname.', 'error');
    if (nickname.length < 2) return Utils.toast('Nickname must be at least 2 characters.', 'error');

    // Quick existence check
    try {
      const resp = await fetch(`${CONFIG.BACKEND_URL}/api/rooms/${roomId}`);
      if (!resp.ok) return Utils.toast('Room not found. Check the Room ID.', 'error');
      const data = await resp.json();
      if (data.locked) return Utils.toast('This room is locked.', 'error');
    } catch {
      // Server might be local, proceed anyway
    }

    joinBtn.disabled = true;
    joinBtn.textContent = 'Joining...';

    Utils.store.set('pendingRoom', { action: 'join', roomId, nickname, adminPassword });
    window.location.href = 'room.html';
  });

  // Enter key support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (!joinForm.style.display || joinForm.style.display === 'none') {
        createBtn?.click();
      } else {
        joinBtn?.click();
      }
    }
  });

  // Animate stats from server
  async function updateStats() {
    try {
      const resp = await fetch(`${CONFIG.BACKEND_URL}/api/health`);
      if (resp.ok) {
        document.getElementById('stat-server')?.style && (document.getElementById('stat-server').textContent = 'Online');
      }
    } catch {}
  }
  updateStats();
});
