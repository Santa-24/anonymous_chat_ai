import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';

// In-memory storage (passed from server.js)
let rooms, users, messages;

export default (storage) => {
    ({ rooms, users, messages } = storage);
    return router;
};

// Create a new room
router.post('/create', (req, res) => {
    try {
        const { username, settings = {} } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        // Generate room ID (6 characters)
        const roomId = generateRoomId();
        
        // Generate admin token for room creator
        const adminToken = jwt.sign(
            { 
                roomId, 
                username, 
                isRoomAdmin: true,
                sessionId: uuidv4() 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Create room
        const room = {
            id: roomId,
            createdBy: username,
            createdAt: new Date().toISOString(),
            aiEnabled: settings.enableAI || false,
            locked: settings.locked || false,
            users: new Set(),
            settings: {
                maxUsers: 50,
                messageHistory: 1000
            }
        };

        rooms.set(roomId, room);
        messages.set(roomId, []);

        res.json({
            roomId,
            adminToken,
            settings: room,
            inviteLink: `/room/${roomId}`
        });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Join existing room
router.post('/:roomId/join', (req, res) => {
    try {
        const { roomId } = req.params;
        const { username } = req.body;

        if (!username || username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        const room = rooms.get(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.locked) {
            return res.status(403).json({ error: 'Room is locked' });
        }

        // Check if username already exists in room
        const existingUser = Array.from(users.values())
            .find(u => u.roomId === roomId && u.username === username);
        
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken in this room' });
        }

        res.json({
            roomId,
            settings: room,
            success: true
        });
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// Get room info
router.get('/:roomId', (req, res) => {
    try {
        const { roomId } = req.params;
        const room = rooms.get(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Don't expose all internal data
        const publicRoom = {
            id: room.id,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            aiEnabled: room.aiEnabled,
            locked: room.locked,
            userCount: room.users?.size || 0
        };

        res.json(publicRoom);
    } catch (error) {
        console.error('Error getting room info:', error);
        res.status(500).json({ error: 'Failed to get room info' });
    }
});

// Helper function to generate room ID
function generateRoomId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}