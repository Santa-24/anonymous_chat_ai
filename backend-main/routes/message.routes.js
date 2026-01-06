import express from 'express';

const router = express.Router();

// In-memory storage (passed from server.js)
let messages;

export default (storage) => {
    ({ messages } = storage);
    return router;
};

// Get messages for a room
router.get('/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        const roomMessages = messages.get(roomId) || [];

        // Limit to last 100 messages
        const limitedMessages = roomMessages.slice(-100);

        res.json(limitedMessages);
    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

// Delete a message (room admin only)
router.delete('/:roomId/:messageId', (req, res) => {
    try {
        const { roomId, messageId } = req.params;
        const { adminToken } = req.query;

        if (!adminToken) {
            return res.status(401).json({ error: 'Admin token required' });
        }

        // Verify admin token
        // In a real implementation, you would verify the JWT token
        const roomMessages = messages.get(roomId);
        if (!roomMessages) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const messageIndex = roomMessages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Remove message
        roomMessages.splice(messageIndex, 1);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});