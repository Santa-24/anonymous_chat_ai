const express = require('express');
const router = express.Router();
const { getStats, getAllRooms, broadcastMessage, kickUserGlobal } = require('../controllers/admin.controller');
const { globalAdminAuth } = require('../middlewares/globalAdmin');

router.get('/stats', globalAdminAuth, getStats);
router.get('/rooms', globalAdminAuth, getAllRooms);
router.post('/broadcast', globalAdminAuth, broadcastMessage);
router.post('/kick', globalAdminAuth, kickUserGlobal);

module.exports = router;
