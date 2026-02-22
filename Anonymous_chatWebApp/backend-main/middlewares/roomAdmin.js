// middlewares/roomAdmin.js
export function roomAdminAuth(req, res, next) {
  const { roomId } = req.params;
  const rooms = global.rooms;

  if (!rooms) return res.status(500).json({ error: 'Server not initialized.' });

  const room = rooms.get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  const providedPassword =
    req.headers['x-room-password'] || req.body?.adminPassword;

  if (!providedPassword || providedPassword !== room.adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid room admin password.' });
  }

  req.room = room;
  next();
}
