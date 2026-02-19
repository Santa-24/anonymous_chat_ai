const express = require('express');
const router = express.Router();
const { listRooms, getRoomInfo, deleteRoomAdmin } = require('../controllers/room.controller');
const { globalAdminAuth } = require('../middlewares/globalAdmin');
const { strictRateLimiter } = require('../middlewares/rateLimit');

router.get('/', globalAdminAuth, listRooms);
router.get('/:roomId', getRoomInfo);
router.delete('/:roomId', globalAdminAuth, deleteRoomAdmin);

module.exports = router;
