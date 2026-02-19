const { getAIResponse } = require('./services/ai.service');

module.exports = function (io) {
  const rooms = new Map();

  io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id);

    // ─── CREATE ROOM ─────────────────────────────
    socket.on('create_room', ({ nickname, enableAI }) => {
      const roomId = Math.floor(100000 + Math.random() * 900000).toString();

      rooms.set(roomId, {
        id: roomId,
        users: new Map(),
        messages: [],
        enableAI: !!enableAI,
      });

      rooms.get(roomId).users.set(socket.id, {
        nickname,
        isAdmin: true,
      });

      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.isAdmin = true;

      socket.emit('room_joined', {
        roomId,
        nickname,
        isAdmin: true,
        enableAI,
      });

      io.to(roomId).emit('user_list', getUsers(roomId));
    });

    // ─── JOIN ROOM ───────────────────────────────
    socket.on('join_room', ({ roomId, nickname }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }

      room.users.set(socket.id, {
        nickname,
        isAdmin: false,
      });

      socket.join(roomId);
      socket.roomId = roomId;
      socket.nickname = nickname;
      socket.isAdmin = false;

      socket.emit('room_joined', {
        roomId,
        nickname,
        isAdmin: false,
        enableAI: room.enableAI,
      });

      io.to(roomId).emit('user_list', getUsers(roomId));
    });

    // ─── SEND MESSAGE ────────────────────────────
    socket.on('send_message', async ({ text }) => {
      const room = rooms.get(socket.roomId);
      if (!room) return;

      const msg = {
        id: Date.now().toString(),
        type: 'chat',
        nickname: socket.nickname,
        text,
        timestamp: Date.now(),
      };

      room.messages.push(msg);
      io.to(socket.roomId).emit('message', msg);

      // 🤖 AI TRIGGER (ONLY @ai)
      if (room.enableAI && text.toLowerCase().startsWith('@ai')) {
        // show thinking
        io.to(socket.roomId).emit('message', {
          type: 'ai_thinking',
        });

        try {
          const prompt = text.replace('@ai', '').trim();

          // only last 5 user messages for context
          const context = room.messages
            .filter((m) => m.type === 'chat')
            .slice(-5)
            .map((m) => ({
              role: 'user',
              content: m.text,
            }));

          const aiReply = await getAIResponse(prompt, context);

          io.to(socket.roomId).emit('message', {
            type: 'ai',
            text: aiReply || '🤖 I could not generate a response.',
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error('[AI ERROR]', err.message);

          // 🚑 FAILSAFE RESPONSE
          io.to(socket.roomId).emit('message', {
            type: 'ai',
            text: '⚠️ AI is temporarily unavailable. Please try again.',
            timestamp: Date.now(),
          });
        }
      }
    });

    // ─── DISCONNECT ──────────────────────────────
    socket.on('disconnect', () => {
      const room = rooms.get(socket.roomId);
      if (!room) return;

      room.users.delete(socket.id);
      io.to(socket.roomId).emit('user_list', getUsers(socket.roomId));

      if (room.users.size === 0) {
        rooms.delete(socket.roomId);
      }

      console.log('❌ Disconnected:', socket.id);
    });
  });

  function getUsers(roomId) {
    const room = rooms.get(roomId);
    if (!room) return [];
    return [...room.users.values()].map((u) => u.nickname);
  }
};
