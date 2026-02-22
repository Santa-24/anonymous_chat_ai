// routes/message.routes.js
import express from 'express';
import { getRoomMessages, deleteMessage, clearRoomMessages } from '../controllers/message.controller.js';
import { globalAdminAuth } from '../middlewares/globalAdmin.js';

const router = express.Router();

// Note: clear must be before /:messageId to avoid route collision
router.get('/:roomId', globalAdminAuth, getRoomMessages);
router.delete('/:roomId/clear', globalAdminAuth, clearRoomMessages);
router.delete('/:roomId/:messageId', globalAdminAuth, deleteMessage);

export default router;
