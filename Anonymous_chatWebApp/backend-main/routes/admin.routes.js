// routes/admin.routes.js
import express from 'express';
import { verifyAdmin, getStats, getRooms, broadcast, deleteRoomAdmin } from '../controllers/admin.controller.js';

const router = express.Router();

// All admin routes require global admin auth
router.get('/stats', verifyAdmin, getStats);
router.get('/rooms', verifyAdmin, getRooms);
router.post('/broadcast', verifyAdmin, broadcast);
router.delete('/rooms/:roomId', verifyAdmin, deleteRoomAdmin);

export default router;
