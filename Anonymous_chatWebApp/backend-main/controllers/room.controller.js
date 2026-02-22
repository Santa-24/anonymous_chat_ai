// controllers/room.controller.js

// GET /api/rooms
export function listRooms(req, res) {
  const rooms = global.rooms;
  if (!rooms) return res.status(500).json({ error: 'Server not initialized.' });

  const roomList = [];
  rooms.forEach((room, id) => {
    roomList.push({
      id,
      userCount: room.users.size,
      locked: room.locked,
      enableAI: room.enableAI,
      createdAt: room.createdAt,
      messageCount: room.messageCount || room.messages.length
    });
  });

  res.json({ rooms: roomList, total: roomList.length });
}

// GET /api/rooms/:roomId
export function getRoomInfo(req, res) {
  const { roomId } = req.params;
  const rooms = global.rooms;
  const room = rooms?.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found.' });

  res.json({
    id: roomId,
    userCount: room.users.size,
    locked: room.locked,
    enableAI: room.enableAI,
    createdAt: room.createdAt,
    users: [...room.users.values()],
    messageCount: room.messageCount || room.messages.length
  });
}

// DELETE /api/rooms/:roomId  (also called by admin dashboard)
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
