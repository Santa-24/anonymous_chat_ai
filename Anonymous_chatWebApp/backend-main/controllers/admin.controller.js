// controllers/admin.controller.js
import { globalAdminAuth } from '../middlewares/globalAdmin.js';

// Re-export middleware for routes
export { globalAdminAuth as verifyAdmin };

// GET /api/admin/stats
export function getStats(req, res) {
  const rooms = global.rooms;
  if (!rooms) return res.status(500).json({ error: 'Server not initialized.' });

  let totalUsers = 0;
  let totalMessages = 0;
  rooms.forEach(room => {
    totalUsers += room.users.size;
    totalMessages += room.messageCount || room.messages.length;
  });

  res.json({
    totalRooms: rooms.size,
    totalUsers,
    totalMessages,
    uptime: process.uptime()
  });
}

// GET /api/admin/rooms
export function getRooms(req, res) {
  const rooms = global.rooms;
  if (!rooms) return res.status(500).json({ error: 'Server not initialized.' });

  const roomList = [];
  rooms.forEach((room, id) => {
    roomList.push({
      id,
      adminNickname: room.adminNickname || '—',
      userCount: room.users.size,
      users: [...room.users.values()],
      locked: room.locked,
      enableAI: room.enableAI,
      messageCount: room.messageCount || room.messages.length,
      createdAt: room.createdAt
    });
  });

  res.json({ rooms: roomList, total: roomList.length });
}

// POST /api/admin/broadcast
export function broadcast(req, res) {
  const io = global.io;
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const broadcastMsg = {
    id: `bc-${Date.now()}`,
    type: 'broadcast',
    text: message.trim(),
    timestamp: Date.now()
  };

  io.emit('message', broadcastMsg);
  res.json({ success: true, message: 'Broadcast sent.' });
}

// DELETE /api/admin/rooms/:roomId  (global admin force-delete)
export function deleteRoomAdmin(req, res) {
  const { roomId } = req.params;
  const rooms = global.rooms;
  const io = global.io;

  const room = rooms?.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  io.to(roomId).emit('room_deleted', { message: 'Room deleted by global admin.' });
  rooms.delete(roomId);
  io.emit('stats_update');
  res.json({ success: true, message: `Room ${roomId} deleted.` });
}
