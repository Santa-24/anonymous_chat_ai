// controllers/message.controller.js

// GET /api/messages/:roomId
export function getRoomMessages(req, res) {
  const { roomId } = req.params;
  const rooms = global.rooms;
  const room = rooms?.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const limit = parseInt(req.query.limit) || 100;
  res.json({ messages: room.messages.slice(-limit), total: room.messages.length });
}

// DELETE /api/messages/:roomId/:messageId
export function deleteMessage(req, res) {
  const { roomId, messageId } = req.params;
  const rooms = global.rooms;
  const io = global.io;
  const room = rooms?.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const idx = room.messages.findIndex(m => m.id === messageId);
  if (idx === -1) return res.status(404).json({ error: 'Message not found.' });

  room.messages.splice(idx, 1);
  io.to(roomId).emit('message_deleted', { messageId });
  res.json({ success: true });
}

// DELETE /api/messages/:roomId/clear
export function clearRoomMessages(req, res) {
  const { roomId } = req.params;
  const rooms = global.rooms;
  const io = global.io;
  const room = rooms?.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found.' });

  room.messages = [];
  io.to(roomId).emit('chat_cleared');
  res.json({ success: true, message: 'Chat cleared.' });
}
