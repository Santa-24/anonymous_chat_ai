// Room Page Logic
document.addEventListener('DOMContentLoaded', () => {
  Utils.initTheme();

  const pending = Utils.store.get('pendingRoom');
  if (!pending) { window.location.href = 'index.html'; return; }
  Utils.store.remove('pendingRoom');

  // State
  let socket = null;
  let myNickname = '';
  let myRoomId = '';
  let isAdmin = false;
  let enableAI = false;
  let isConnected = false;
  let typingTimeout = null;
  let isTyping = false;
  let typingUsers = new Set();
  let userList = [];

  // DOM refs
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const roomIdDisplay = document.getElementById('room-id-display');
  const roomTitle = document.getElementById('room-title');
  const userCountEl = document.getElementById('user-count');
  const userListEl = document.getElementById('user-list');
  const typingIndicator = document.getElementById('typing-indicator');
  const connectionStatus = document.getElementById('connection-status');
  const themeToggle = document.getElementById('theme-toggle');
  const adminPanel = document.getElementById('admin-panel');
  const aiPanel = document.getElementById('ai-panel');
  const charCount = document.getElementById('char-count');
  const leaveBtn = document.getElementById('leave-btn');
  const shareBtn = document.getElementById('share-btn');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');

  // Theme
  themeToggle?.addEventListener('click', () => {
    const next = Utils.getTheme() === 'dark' ? 'light' : 'dark';
    Utils.setTheme(next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
  themeToggle && (themeToggle.textContent = Utils.getTheme() === 'dark' ? '☀️' : '🌙');

  // Sidebar
  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });

  // ─── CONNECT SOCKET ───────────────────────────────────────────
  socket = io(CONFIG.BACKEND_URL, CONFIG.SOCKET_OPTIONS);

  socket.on('connect', () => {
    isConnected = true;
    updateConnectionStatus(true);

    if (pending.action === 'create') {
      socket.emit('create_room', {
        nickname: pending.nickname,
        enableAI: pending.enableAI,
        adminPassword: pending.adminPassword
      }, handleRoomCallback);
    } else {
      socket.emit('join_room', {
        roomId: pending.roomId,
        nickname: pending.nickname,
        adminPassword: pending.adminPassword
      }, handleRoomCallback);
    }
  });

  socket.on('disconnect', () => {
    isConnected = false;
    updateConnectionStatus(false);
  });

  socket.on('reconnect', () => {
    updateConnectionStatus(true);
    Utils.toast('Reconnected!', 'success');
  });

  function handleRoomCallback(data) {
    if (!data.success) {
      Utils.toast(data.error || 'Failed to join room.', 'error');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }
  }

  // ─── ROOM JOINED ─────────────────────────────────────────────
  socket.on('room_joined', (data) => {
    myRoomId = data.roomId;
    myNickname = data.nickname;
    isAdmin = data.isAdmin;
    enableAI = data.enableAI;

    if (roomIdDisplay) roomIdDisplay.textContent = myRoomId;
    if (roomTitle) roomTitle.textContent = `Room ${myRoomId}`;
    document.title = `Room ${myRoomId} - AnonChat`;

    if (isAdmin && adminPanel) adminPanel.style.display = 'flex';
    if (enableAI && aiPanel) {
      aiPanel.style.display = 'block';
      document.getElementById('ai-hint')?.style && (document.getElementById('ai-hint').style.display = 'block');
    }

    messageInput?.focus();
  });

  // ─── MESSAGES ─────────────────────────────────────────────────
  socket.on('chat_history', (messages) => {
    chatMessages.innerHTML = '';
    messages.forEach(renderMessage);
    scrollToBottom();
  });

  socket.on('message', (msg) => {
    renderMessage(msg);
    scrollToBottom();
    // Remove AI thinking placeholder
    if (msg.type !== 'ai_thinking') {
      const thinking = chatMessages.querySelector('.msg-ai-thinking');
      thinking?.remove();
    }
  });

  socket.on('message_deleted', ({ messageId }) => {
    const el = document.querySelector(`[data-message-id="${messageId}"]`);
    if (el) {
      el.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => el.remove(), 300);
    }
  });

  socket.on('chat_cleared', () => {
    chatMessages.innerHTML = '';
    addSystemMessage('💬 Chat has been cleared.');
  });

  socket.on('room_locked', ({ locked }) => {
    const lockBtn = document.getElementById('btn-lock');
    if (lockBtn) lockBtn.textContent = locked ? '🔓 Unlock Room' : '🔒 Lock Room';
  });

  socket.on('room_deleted', ({ message }) => {
    Utils.toast(message, 'warning');
    setTimeout(() => window.location.href = 'index.html', 2500);
  });

  socket.on('kicked', ({ reason }) => {
    Utils.toast(`You were removed: ${reason}`, 'error');
    setTimeout(() => window.location.href = 'index.html', 2500);
  });

  // ─── USERS ────────────────────────────────────────────────────
  socket.on('user_list', (users) => {
    userList = users;
    if (userCountEl) userCountEl.textContent = users.length;
    renderUserList(users);
  });

  function renderUserList(users) {
    if (!userListEl) return;
    userListEl.innerHTML = users.map(nick => `
      <div class="user-item ${nick === myNickname ? 'me' : ''}" data-nick="${Utils.escapeHtml(nick)}">
        <div class="user-avatar" style="background:${Utils.avatarColor(nick)}">${Utils.initials(nick)}</div>
        <span class="user-nick">${Utils.escapeHtml(nick)}${nick === myNickname ? ' (you)' : ''}</span>
        ${isAdmin && nick !== myNickname ? `<button class="kick-btn" onclick="kickUser('${Utils.escapeHtml(nick)}')">✕</button>` : ''}
      </div>
    `).join('');
  }

  window.kickUser = (nickname) => {
    if (!confirm(`Kick ${nickname}?`)) return;
    socket.emit('kick_user', { nickname }, (data) => {
      if (data?.success) Utils.toast(`${nickname} kicked.`, 'success');
      else Utils.toast(data?.error || 'Failed.', 'error');
    });
  };

  // ─── TYPING ──────────────────────────────────────────────────
  socket.on('user_typing', ({ nickname, isTyping: typing }) => {
    if (nickname === myNickname) return;
    if (typing) typingUsers.add(nickname); else typingUsers.delete(nickname);
    updateTypingIndicator();
  });

  function updateTypingIndicator() {
    if (!typingIndicator) return;
    const users = [...typingUsers];
    if (users.length === 0) {
      typingIndicator.style.display = 'none';
    } else {
      typingIndicator.style.display = 'flex';
      typingIndicator.querySelector('.typing-text').textContent =
        users.length === 1 ? `${users[0]} is typing...` :
        users.length === 2 ? `${users[0]} and ${users[1]} are typing...` :
        `${users.length} people are typing...`;
    }
  }

  messageInput?.addEventListener('input', () => {
    const len = messageInput.value.length;
    if (charCount) charCount.textContent = `${len}/${CONFIG.MAX_MESSAGE_LENGTH}`;
    charCount && (charCount.style.color = len > CONFIG.MAX_MESSAGE_LENGTH * 0.9 ? '#f38ba8' : '');

    if (!isTyping) {
      isTyping = true;
      socket.emit('typing', { isTyping: true });
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit('typing', { isTyping: false });
    }, CONFIG.TYPING_TIMEOUT);
  });

  // ─── SEND MESSAGE ─────────────────────────────────────────────
  function sendMessage() {
    const text = messageInput?.value.trim();
    if (!text || !isConnected) return;
    if (text.length > CONFIG.MAX_MESSAGE_LENGTH) return Utils.toast('Message too long.', 'error');

    socket.emit('send_message', { text }, (data) => {
      if (data && !data.success) Utils.toast(data.error, 'error');
    });
    messageInput.value = '';
    if (charCount) charCount.textContent = `0/${CONFIG.MAX_MESSAGE_LENGTH}`;
    isTyping = false;
    clearTimeout(typingTimeout);
    socket.emit('typing', { isTyping: false });
  }

  sendBtn?.addEventListener('click', sendMessage);
  messageInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // ─── RENDER MESSAGE ───────────────────────────────────────────
  function renderMessage(msg) {
    if (!chatMessages) return;
    const isMine = msg.nickname === myNickname;
    const el = document.createElement('div');
    el.setAttribute('data-message-id', msg.id || '');

    if (msg.type === 'system') {
      el.className = 'msg-system';
      el.innerHTML = `<span>${Utils.escapeHtml(msg.text)}</span><span class="msg-time">${Utils.formatTime(msg.timestamp)}</span>`;
    } else if (msg.type === 'broadcast') {
      el.className = 'msg-broadcast';
      el.innerHTML = `<span class="broadcast-icon">📢</span><div><strong>Global Admin</strong><p>${Utils.escapeHtml(msg.text)}</p></div>`;
    } else if (msg.type === 'ai_thinking') {
      el.className = 'msg-ai-thinking';
      el.innerHTML = `<div class="typing-dots"><span></span><span></span><span></span></div><span>AI is thinking...</span>`;
    } else if (msg.type === 'ai') {
      el.className = 'msg-bubble msg-ai';
      el.innerHTML = `
        <div class="bubble-avatar ai-avatar">🤖</div>
        <div class="bubble-content">
          <div class="bubble-header"><span class="bubble-nick">AI Assistant</span><span class="bubble-time">${Utils.formatTime(msg.timestamp)}</span></div>
          <div class="bubble-text ai-text">${Utils.linkify(msg.text)}</div>
        </div>`;
    } else {
      el.className = `msg-bubble ${isMine ? 'msg-mine' : 'msg-theirs'}`;
      const adminBadge = msg.isAdmin ? '<span class="admin-badge">ADMIN</span>' : '';
      el.innerHTML = `
        <div class="bubble-avatar" style="background:${Utils.avatarColor(msg.nickname)}">${Utils.initials(msg.nickname)}</div>
        <div class="bubble-content">
          <div class="bubble-header">
            <span class="bubble-nick">${Utils.escapeHtml(msg.nickname)}${adminBadge}</span>
            <span class="bubble-time">${Utils.formatTime(msg.timestamp)}</span>
            ${isAdmin ? `<button class="del-msg-btn" title="Delete" onclick="deleteMsg('${msg.id}')">🗑</button>` : ''}
          </div>
          <div class="bubble-text">${Utils.linkify(msg.text)}</div>
        </div>`;
    }
    chatMessages.appendChild(el);
  }

  window.deleteMsg = (id) => {
    socket.emit('delete_message', { messageId: id }, (data) => {
      if (!data?.success) Utils.toast(data?.error || 'Failed.', 'error');
    });
  };

  function addSystemMessage(text) {
    const el = document.createElement('div');
    el.className = 'msg-system';
    el.innerHTML = `<span>${text}</span>`;
    chatMessages?.appendChild(el);
    scrollToBottom();
  }

  function scrollToBottom() {
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ─── CONNECTION STATUS ────────────────────────────────────────
  function updateConnectionStatus(connected) {
    if (!connectionStatus) return;
    connectionStatus.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
    connectionStatus.title = connected ? 'Connected' : 'Disconnected - reconnecting...';
  }

  // ─── ADMIN CONTROLS ───────────────────────────────────────────
  document.getElementById('btn-lock')?.addEventListener('click', () => {
    socket.emit('toggle_lock', (data) => {
      if (!data?.success) Utils.toast('Failed.', 'error');
    });
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    if (!confirm('Clear all messages?')) return;
    socket.emit('clear_chat', (data) => {
      if (!data?.success) Utils.toast('Failed.', 'error');
    });
  });

  document.getElementById('btn-delete')?.addEventListener('click', () => {
    if (!confirm('Delete this room permanently?')) return;
    socket.emit('delete_room', (data) => {
      if (!data?.success) Utils.toast('Failed.', 'error');
    });
  });

  // ─── SHARE ────────────────────────────────────────────────────
  shareBtn?.addEventListener('click', async () => {
    const url = `${window.location.origin}/index.html?room=${myRoomId}`;
    await Utils.copyToClipboard(url);
    Utils.toast('Room link copied!', 'success');
  });

  document.getElementById('copy-room-id')?.addEventListener('click', async () => {
    await Utils.copyToClipboard(myRoomId);
    Utils.toast('Room ID copied!', 'success');
  });

  // ─── LEAVE ────────────────────────────────────────────────────
  leaveBtn?.addEventListener('click', () => {
    if (confirm('Leave this room?')) {
      socket.disconnect();
      window.location.href = 'index.html';
    }
  });

  window.addEventListener('beforeunload', () => {
    socket?.disconnect();
  });
});
