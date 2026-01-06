import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// In-memory storage (passed from server.js)
let rooms, users, messages, adminSessions;

export default (storage) => {
    ({ rooms, users, messages, adminSessions } = storage);
    return router;
};

// Global admin login
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Verify admin credentials
        if (username !== ADMIN_USERNAME) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const passwordValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create admin session
        const sessionId = Math.random().toString(36).substr(2);
        const token = jwt.sign(
            {
                username: ADMIN_USERNAME,
                sessionId,
                isGlobalAdmin: true
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        adminSessions.add(sessionId);

        res.json({
            token,
            username: ADMIN_USERNAME,
            sessionId
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get all rooms (admin only)
router.get('/rooms', verifyGlobalAdmin, (req, res) => {
    try {
        const allRooms = Array.from(rooms.entries()).map(([id, room]) => ({
            id,
            createdBy: room.createdBy,
            createdAt: room.createdAt,
            aiEnabled: room.aiEnabled,
            locked: room.locked,
            userCount: room.users?.size || 0,
            messageCount: messages.get(id)?.length || 0,
            lastActivity: getLastActivity(id)
        }));

        res.json(allRooms);
    } catch (error) {
        console.error('Error getting all rooms:', error);
        res.status(500).json({ error: 'Failed to get rooms' });
    }
});

// Get room details (admin only)
router.get('/rooms/:roomId', verifyGlobalAdmin, (req, res) => {
    try {
        const { roomId } = req.params;
        const room = rooms.get(roomId);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const roomUsers = Array.from(users.values())
            .filter(u => u.roomId === roomId)
            .map(u => ({
                id: u.id,
                username: u.username,
                isAdmin: u.isAdmin,
                joinedAt: u.joinedAt,
                lastActive: u.lastActive
            }));

        const roomDetails = {
            ...room,
            users: roomUsers,
            messages: messages.get(roomId) || []
        };

        res.json(roomDetails);
    } catch (error) {
        console.error('Error getting room details:', error);
        res.status(500).json({ error: 'Failed to get room details' });
    }
});

// Delete a room (admin only)
router.delete('/rooms/:roomId', verifyGlobalAdmin, (req, res) => {
    try {
        const { roomId } = req.params;

        if (!rooms.has(roomId)) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Delete room
        rooms.delete(roomId);
        messages.delete(roomId);

        // Remove users from this room
        for (const [userId, user] of users.entries()) {
            if (user.roomId === roomId) {
                users.delete(userId);
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        res.status(500).json({ error: 'Failed to delete room' });
    }
});

// Get all users (admin only)
router.get('/users', verifyGlobalAdmin, (req, res) => {
    try {
        const allUsers = Array.from(users.values()).map(user => ({
            id: user.id,
            username: user.username,
            roomId: user.roomId,
            isAdmin: user.isAdmin,
            joinedAt: user.joinedAt,
            lastActive: user.lastActive,
            socketId: user.socketId
        }));

        res.json(allUsers);
    } catch (error) {
        console.error('Error getting all users:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Ban user (admin only)
router.post('/users/:userId/ban', verifyGlobalAdmin, (req, res) => {
    try {
        const { userId } = req.params;
        const user = users.get(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove user from system
        users.delete(userId);

        // Remove from room
        const room = rooms.get(user.roomId);
        if (room?.users) {
            room.users.delete(userId);
        }

        res.json({
            success: true,
            message: `User ${user.username} has been banned`
        });
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({ error: 'Failed to ban user' });
    }
    // Get system statistics (admin only)
    router.get('/stats', verifyGlobalAdmin, (req, res) => {
        try {
            const stats = {
                totalRooms: rooms.size,
                totalUsers: users.size,
                totalMessages: Array.from(messages.values()).reduce((acc, msgs) => acc + msgs.length, 0),
                activeAdminSessions: adminSessions.size,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                activeRooms: Array.from(rooms.values()).filter(room => room.users?.size > 0).length,
                roomsCreated24h: Array.from(rooms.values()).filter(room => {
                    const createdAt = new Date(room.createdAt);
                    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return createdAt > twentyFourHoursAgo;
                }).length
            };

            res.json(stats);
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    });

    // Enable/disable maintenance mode (admin only)
    router.post('/maintenance', verifyGlobalAdmin, (req, res) => {
        try {
            const { enabled, message } = req.body;

            // In a real implementation, you would set a global maintenance flag
            // and broadcast to all connected clients

            const maintenance = {
                enabled: Boolean(enabled),
                message: message || 'System under maintenance. Please try again later.',
                enabledAt: new Date().toISOString(),
                enabledBy: req.admin.username
            };

            // Broadcast maintenance mode to all connected sockets
            // This would be handled by socket.io

            res.json({
                success: true,
                maintenance
            });
        } catch (error) {
            console.error('Error setting maintenance:', error);
            res.status(500).json({ error: 'Failed to set maintenance mode' });
        }
    });

    // Middleware to verify global admin
    function verifyGlobalAdmin(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);

            if (!decoded.isGlobalAdmin || !adminSessions.has(decoded.sessionId)) {
                return res.status(403).json({ error: 'Not authorized as global admin' });
            }

            req.admin = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }
    }

    // Helper function to get last activity for a room
    function getLastActivity(roomId) {
        const roomMessages = messages.get(roomId);
        if (!roomMessages || roomMessages.length === 0) {
            return null;
        }

        const lastMessage = roomMessages[roomMessages.length - 1];
        return lastMessage.createdAt;
    }