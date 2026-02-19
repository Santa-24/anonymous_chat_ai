const express = require('express');
const router = express.Router();
const { getRoomMessages, deleteMessage, clearRoomMessages } = require('../controllers/message.controller');
const { globalAdminAuth } = require('../middlewares/globalAdmin');

router.get('/:roomId', globalAdminAuth, getRoomMessages);
router.delete('/:roomId/clear', globalAdminAuth, clearRoomMessages);
router.delete('/:roomId/:messageId', globalAdminAuth, deleteMessage);

module.exports = router;
