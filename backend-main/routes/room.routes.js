// routes/room.routes.js
import express from 'express';
import { listRooms, getRoomInfo, deleteRoomAdmin } from '../controllers/room.controller.js';
import { globalAdminAuth } from '../middlewares/globalAdmin.js';

const router = express.Router();

// Public: frontend checks if room exists before joining
router.get('/:roomId', getRoomInfo);

// Admin: list all rooms (also used by admin dashboard)
router.get('/', globalAdminAuth, listRooms);

// Admin: delete a room (admin.js deleteRoom calls DELETE /api/rooms/:roomId)
router.delete('/:roomId', globalAdminAuth, deleteRoomAdmin);

export default router;
