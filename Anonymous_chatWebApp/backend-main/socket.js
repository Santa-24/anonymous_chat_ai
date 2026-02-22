// socket.js — Full real-time logic
import { getAIResponse } from './services/ai.service.js';

export default function initSocket(io) {
  const rooms = global.rooms; // shared with controllers

  io.on('connection', (socket) => {

    // ─── CREATE ROOM ────────────────────────────────────────────
    socket.on('create_room', ({ nickname, adminPassword, enableAI }, cb) => {
      if (!nickname || nickname.length < 2 || nickname.length > 20) {
        return cb({ success: false, error: 'Invalid nickname.' });
      }

      const roomId = Math.floor(100000 + Math.random() * 900000).toString();

      const room = {
        users: new Map(),          // socketId → nickname
        messages: [],
        adminNickname: nickname,
        adminPassword: adminPassword || null,
        locked: false,
        enableAI: !!enableAI,
        createdAt: Date.now(),
        messageCount: 0
      };

      rooms.set(roomId, room);
      room.users.set(socket.id, nickname);

      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.isAdmin = true;

      // Acknowledge callback first
      cb({ success: true });

      // Then emit room_joined event (frontend listens for this)
      socket.emit('room_joined', {
        roomId,
        nickname,
        isAdmin: true,
        enableAI: room.enableAI
      });

      // Send empty chat history
      socket.emit('chat_history', []);

      // Broadcast updated user list
      io.to(roomId).emit('user_list', getUserList(room));

      // System message
      const sysMsg = makeSystemMsg(`${nickname} created the room`);
      room.messages.push(sysMsg);
      io.to(roomId).emit('message', sysMsg);

      io.emit('stats_update');
      console.log(`[ROOM] ${roomId} created by ${nickname}`);
    });

    // ─── JOIN ROOM ───────────────────────────────────────────────
    socket.on('join_room', ({ roomId, nickname, adminPassword }, cb) => {
      if (!nickname || nickname.length < 2 || nickname.length > 20) {
        return cb({ success: false, error: 'Invalid nickname.' });
      }

      const room = rooms.get(roomId);
      if (!room) {
        return cb({ success: false, error: 'Room not found.' });
      }

      if (room.locked) {
        return cb({ success: false, error: 'This room is locked.' });
      }

      // Check if nickname already taken in this room
      const takenNicks = [...room.users.values()];
      if (takenNicks.includes(nickname)) {
        return cb({ success: false, error: 'Nickname already taken in this room.' });
      }

      // Check if joining as admin
      const isAdmin = !!(adminPassword && adminPassword === room.adminPassword && nickname === room.adminNickname);

      room.users.set(socket.id, nickname);

      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.isAdmin = isAdmin;

      cb({ success: true });

      socket.emit('room_joined', {
        roomId,
        nickname,
        isAdmin,
        enableAI: room.enableAI
      });

      // Send chat history (last 100 messages)
      socket.emit('chat_history', room.messages.slice(-100));

      // Update user list for everyone
      io.to(roomId).emit('user_list', getUserList(room));

      // System message
      const sysMsg = makeSystemMsg(`${nickname} joined the room`);
      room.messages.push(sysMsg);
      io.to(roomId).emit('message', sysMsg);

      console.log(`[ROOM] ${nickname} joined ${roomId}`);
    });

    // ─── SEND MESSAGE ─────────────────────────────────────────────
    socket.on('send_message', ({ text }, cb) => {
      const room = rooms.get(socket.roomId);
      if (!room) return cb?.({ success: false, error: 'Not in a room.' });

      if (!text || typeof text !== 'string') return cb?.({ success: false, error: 'Empty message.' });
      const trimmed = text.trim();
      if (!trimmed) return cb?.({ success: false, error: 'Empty message.' });
      if (trimmed.length > 2000) return cb?.({ success: false, error: 'Message too long.' });

      const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'chat',
        nickname: socket.nickname,
        text: trimmed,
        timestamp: Date.now(),
        isAdmin: socket.isAdmin
      };

      room.messages.push(message);
      room.messageCount++;
      io.to(socket.roomId).emit('message', message);
      cb?.({ success: true });

      // ── AI integration ──
      if (room.enableAI && trimmed.toLowerCase().startsWith('@ai ')) {
        const prompt = trimmed.slice(4).trim();
        if (prompt) {
          handleAI(socket, room, prompt);
        }
      }
    });

    // ─── TYPING ───────────────────────────────────────────────────
    socket.on('typing', ({ isTyping }) => {
      if (!socket.roomId || !socket.nickname) return;
      socket.to(socket.roomId).emit('user_typing', {
        nickname: socket.nickname,
        isTyping: !!isTyping
      });
    });

    // ─── DELETE MESSAGE ───────────────────────────────────────────
    socket.on('delete_message', ({ messageId }, cb) => {
      if (!socket.isAdmin) return cb?.({ success: false, error: 'Not authorized.' });
      const room = rooms.get(socket.roomId);
      if (!room) return cb?.({ success: false, error: 'Room not found.' });

      const idx = room.messages.findIndex(m => m.id === messageId);
      if (idx === -1) return cb?.({ success: false, error: 'Message not found.' });
      room.messages.splice(idx, 1);
      io.to(socket.roomId).emit('message_deleted', { messageId });
      cb?.({ success: true });
    });

    // ─── KICK USER ────────────────────────────────────────────────
    socket.on('kick_user', ({ nickname }, cb) => {
      if (!socket.isAdmin) return cb?.({ success: false, error: 'Not authorized.' });
      const room = rooms.get(socket.roomId);
      if (!room) return cb?.({ success: false, error: 'Room not found.' });

      // Find the target socket
      let targetSocket = null;
      for (const [sid, nick] of room.users.entries()) {
        if (nick === nickname) {
          targetSocket = io.sockets.sockets.get(sid);
          break;
        }
      }

      if (!targetSocket) return cb?.({ success: false, error: 'User not found.' });

      targetSocket.emit('kicked', { reason: 'Removed by room admin.' });
      targetSocket.leave(socket.roomId);

      // Remove from room
      room.users.delete(targetSocket.id);
      io.to(socket.roomId).emit('user_list', getUserList(room));

      const sysMsg = makeSystemMsg(`${nickname} was removed by admin`);
      room.messages.push(sysMsg);
      io.to(socket.roomId).emit('message', sysMsg);

      cb?.({ success: true });
    });

    // ─── TOGGLE LOCK ─────────────────────────────────────────────
    socket.on('toggle_lock', (cb) => {
      if (!socket.isAdmin) return cb?.({ success: false, error: 'Not authorized.' });
      const room = rooms.get(socket.roomId);
      if (!room) return cb?.({ success: false, error: 'Room not found.' });

      room.locked = !room.locked;
      io.to(socket.roomId).emit('room_locked', { locked: room.locked });
      const sysMsg = makeSystemMsg(room.locked ? '🔒 Room is now locked' : '🔓 Room is now unlocked');
      room.messages.push(sysMsg);
      io.to(socket.roomId).emit('message', sysMsg);
      cb?.({ success: true, locked: room.locked });
    });

    // ─── CLEAR CHAT ───────────────────────────────────────────────
    socket.on('clear_chat', (cb) => {
      if (!socket.isAdmin) return cb?.({ success: false, error: 'Not authorized.' });
      const room = rooms.get(socket.roomId);
      if (!room) return cb?.({ success: false, error: 'Room not found.' });

      room.messages = [];
      io.to(socket.roomId).emit('chat_cleared');
      cb?.({ success: true });
    });

    // ─── DELETE ROOM ──────────────────────────────────────────────
    socket.on('delete_room', (cb) => {
      if (!socket.isAdmin) return cb?.({ success: false, error: 'Not authorized.' });
      const roomId = socket.roomId;
      const room = rooms.get(roomId);
      if (!room) return cb?.({ success: false, error: 'Room not found.' });

      io.to(roomId).emit('room_deleted', { message: 'Room was deleted by the admin.' });
      rooms.delete(roomId);
      io.emit('stats_update');
      cb?.({ success: true });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      const room = rooms.get(socket.roomId);
      if (!room || !socket.nickname) return;

      room.users.delete(socket.id);
      io.to(socket.roomId).emit('user_list', getUserList(room));

      const sysMsg = makeSystemMsg(`${socket.nickname} left the room`);
      room.messages.push(sysMsg);
      io.to(socket.roomId).emit('message', sysMsg);

      // Delete empty rooms
      if (room.users.size === 0) {
        rooms.delete(socket.roomId);
        console.log(`[ROOM] ${socket.roomId} deleted (empty)`);
      }

      io.emit('stats_update');
    });

  }); // end io.on connection
}

// ─── Helpers ────────────────────────────────────────────────────

function getUserList(room) {
  return [...room.users.values()];
}

function makeSystemMsg(text) {
  return {
    id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'system',
    text,
    timestamp: Date.now()
  };
}

async function handleAI(socket, room, prompt) {
  const roomId = socket.roomId;

  // Show thinking indicator to everyone
  const thinkingMsg = {
    id: `thinking-${Date.now()}`,
    type: 'ai_thinking',
    timestamp: Date.now()
  };
  global.io.to(roomId).emit('message', thinkingMsg);

  try {
    // Build context from last 5 chat messages
    const context = room.messages
      .filter(m => m.type === 'chat')
      .slice(-5)
      .map(m => ({ role: 'user', content: `${m.nickname}: ${m.text}` }));

    const aiText = await getAIResponse(prompt, context);

    const aiMsg = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      nickname: 'AI Assistant',
      text: aiText,
      timestamp: Date.now()
    };
    room.messages.push(aiMsg);
    room.messageCount++;
    global.io.to(roomId).emit('message', aiMsg);
  } catch (err) {
    const errMsg = {
      id: `ai-err-${Date.now()}`,
      type: 'ai',
      nickname: 'AI Assistant',
      text: '⚠️ Sorry, I could not process that request right now.',
      timestamp: Date.now()
    };
    global.io.to(roomId).emit('message', errMsg);
  }
}
