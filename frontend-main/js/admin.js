// Global Admin Dashboard
document.addEventListener('DOMContentLoaded', () => {
  Utils.initTheme();

  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const passwordInput = document.getElementById('admin-password-input');
  const loginBtn = document.getElementById('login-btn');
  const themeToggle = document.getElementById('theme-toggle');

  let adminPassword = '';
  let statsInterval = null;
  let socket = null;

  themeToggle?.addEventListener('click', () => {
    const next = Utils.getTheme() === 'dark' ? 'light' : 'dark';
    Utils.setTheme(next);
    themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
  });
  themeToggle && (themeToggle.textContent = Utils.getTheme() === 'dark' ? '☀️' : '🌙');

  loginBtn?.addEventListener('click', async () => {
    const pwd = passwordInput?.value.trim();
    if (!pwd) return Utils.toast('Enter admin password.', 'error');

    loginBtn.disabled = true;
    loginBtn.textContent = 'Verifying...';

    try {
      const resp = await fetch(`${CONFIG.BACKEND_URL}/api/admin/stats`, {
        headers: { 'x-admin-password': pwd }
      });
      if (!resp.ok) {
        Utils.toast('Invalid password.', 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        return;
      }
      adminPassword = pwd;
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      initDashboard();
    } catch {
      Utils.toast('Cannot connect to server.', 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  passwordInput?.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn?.click(); });

  async function apiCall(path, options = {}) {
    const resp = await fetch(`${CONFIG.BACKEND_URL}${path}`, {
      ...options,
      headers: { 'x-admin-password': adminPassword, 'Content-Type': 'application/json', ...options.headers }
    });
    return resp.json();
  }

  async function initDashboard() {
    await loadStats();
    await loadRooms();

    statsInterval = setInterval(async () => {
      await loadStats();
      await loadRooms();
    }, 5000);

    // Real-time stats via socket
    socket = io(CONFIG.BACKEND_URL, CONFIG.SOCKET_OPTIONS);
    socket.on('stats_update', () => { loadStats(); loadRooms(); });

    // Broadcast
    document.getElementById('broadcast-btn')?.addEventListener('click', async () => {
      const msg = document.getElementById('broadcast-input')?.value.trim();
      if (!msg) return Utils.toast('Enter a message.', 'error');
      const data = await apiCall('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      });
      if (data.success) {
        Utils.toast('Broadcast sent!', 'success');
        document.getElementById('broadcast-input').value = '';
      }
    });

    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      loadStats(); loadRooms(); Utils.toast('Refreshed.', 'info');
    });
  }

  async function loadStats() {
    try {
      const data = await apiCall('/api/admin/stats');
      document.getElementById('stat-rooms').textContent = data.totalRooms || 0;
      document.getElementById('stat-users').textContent = data.totalUsers || 0;
      document.getElementById('stat-messages').textContent = data.totalMessages || 0;
      document.getElementById('stat-uptime').textContent = formatUptime(data.uptime || 0);
    } catch {}
  }

  async function loadRooms() {
    try {
      const data = await apiCall('/api/admin/rooms');
      renderRoomsTable(data.rooms || []);
    } catch {}
  }

  function renderRoomsTable(rooms) {
    const tbody = document.getElementById('rooms-tbody');
    if (!tbody) return;
    if (rooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;opacity:0.5;padding:32px;">No active rooms</td></tr>';
      return;
    }
    tbody.innerHTML = rooms.map(room => `
      <tr>
        <td><code class="room-code">${room.id}</code></td>
        <td>${Utils.escapeHtml(room.adminNickname)}</td>
        <td><span class="user-pill">${room.userCount} / ${room.users.join(', ') || 'none'}</span></td>
        <td>
          <span class="badge ${room.locked ? 'badge-red' : 'badge-green'}">${room.locked ? '🔒 Locked' : '🔓 Open'}</span>
          ${room.enableAI ? '<span class="badge badge-blue">🤖 AI</span>' : ''}
        </td>
        <td>${room.messageCount}</td>
        <td>
          <button class="tbl-btn btn-view" onclick="viewRoom('${room.id}')">View</button>
          <button class="tbl-btn btn-delete" onclick="deleteRoom('${room.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  window.viewRoom = (roomId) => { window.open(`room.html?view=${roomId}`, '_blank'); };
  window.deleteRoom = async (roomId) => {
    if (!confirm(`Delete room ${roomId}?`)) return;
    const data = await apiCall(`/api/rooms/${roomId}`, { method: 'DELETE' });
    if (data.success) { Utils.toast(`Room ${roomId} deleted.`, 'success'); loadRooms(); loadStats(); }
    else Utils.toast(data.error || 'Failed.', 'error');
  };

  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  }

  window.addEventListener('beforeunload', () => {
    clearInterval(statsInterval);
    socket?.disconnect();
  });
});
