const { v4: uuidv4 } = require('uuid');

function getStats(req, res) {
  const rooms = global.rooms;
  const stats = global.getRoomStats ? global.getRoomStats() : { totalRooms: 0, totalUsers: 0 };
  let totalMessages = 0;
  rooms?.forEach(r => { totalMessages += r.messages.length; });
  res.json({ ...stats, totalMessages, uptime: process.uptime(), timestamp: new Date() });
}

function getAllRooms(req, res) {
  const rooms = global.rooms;
  const roomList = [];
  rooms?.forEach((room, id) => {
    roomList.push({
      id,
      adminNickname: room.adminNickname,
      userCount: room.users.size,
      users: [...room.users.values()],
      locked: room.locked,
      enableAI: room.enableAI,
      createdAt: room.createdAt,
      messageCount: room.messages.length,
      bannedCount: room.bannedNicknames.size
    });
  });
  res.json({ rooms: roomList, total: roomList.length });
}

function broadcastMessage(req, res) {
  const io = global.io;
  const rooms = global.rooms;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required.' });

  const broadcastMsg = {
    id: uuidv4(),
    type: 'broadcast',
    nickname: '📢 Global Admin',
    text: message,
    timestamp: new Date()
  };

  rooms?.forEach((_, roomId) => {
    io.to(roomId).emit('message', broadcastMsg);
  });

  res.json({ success: true, message: 'Broadcast sent to all rooms.' });
}

function kickUserGlobal(req, res) {
  const { roomId, nickname } = req.body;
  const rooms = global.rooms;
  const io = global.io;
  const room = rooms?.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  let targetSocketId = null;
  room.users.forEach((nick, sid) => { if (nick === nickname) targetSocketId = sid; });
  if (!targetSocketId) return res.status(404).json({ error: 'User not found.' });

  room.bannedNicknames.add(nickname);
  io.to(targetSocketId).emit('kicked', { reason: 'Kicked by global admin.' });
  const targetSocket = io.sockets.sockets.get(targetSocketId);
  if (targetSocket) { targetSocket.leave(roomId); }
  room.users.delete(targetSocketId);
  io.to(roomId).emit('user_list', [...room.users.values()]);
  res.json({ success: true });
}

module.exports = { getStats, getAllRooms, broadcastMessage, kickUserGlobal };
