import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export class AdminController {
    constructor(rooms, users, messages, adminSessions) {
        this.rooms = rooms;
        this.users = users;
        this.messages = messages;
        this.adminSessions = adminSessions;
    }

    // Global admin login
    login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            if (username !== ADMIN_USERNAME) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const passwordValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
            if (!passwordValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

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

            this.adminSessions.add(sessionId);

            res.json({
                token,
                username: ADMIN_USERNAME,
                sessionId
            });
        } catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    // Get all rooms (admin only)
    getAllRooms(req, res) {
        try {
            const allRooms = Array.from(this.rooms.entries()).map(([id, room]) => ({
                id,
                createdBy: room.createdBy,
                createdAt: room.createdAt,
                aiEnabled: room.aiEnabled,
                locked: room.locked,
                userCount: room.users?.size || 0,
                messageCount: this.messages.get(id)?.length || 0,
                lastActivity: this.getLastActivity(id)
            }));

            res.json(allRooms);
        } catch (error) {
            console.error('Error getting all rooms:', error);
            res.status(500).json({ error: 'Failed to get rooms' });
        }
    }

    // Get room details (admin only)
    getRoomDetails(req, res) {
        try {
            const { roomId } = req.params;
            const room = this.rooms.get(roomId);

            if (!room) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const roomUsers = Array.from(this.users.values())
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
                messages: this.messages.get(roomId) || []
            };

            res.json(roomDetails);
        } catch (error) {
            console.error('Error getting room details:', error);
            res.status(500).json({ error: 'Failed to get room details' });
        }
    }

    // Delete a room (admin only)
    deleteRoom(req, res) {
        try {
            const { roomId } = req.params;

            if (!this.rooms.has(roomId)) {
                return res.status(404).json({ error: 'Room not found' });
            }

            this.rooms.delete(roomId);
            this.messages.delete(roomId);

            for (const [userId, user] of this.users.entries()) {
                if (user.roomId === roomId) {
                    this.users.delete(userId);
                }
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error deleting room:', error);
            res.status(500).json({ error: 'Failed to delete room' });
        }
    }

    // Get all users (admin only)
    getAllUsers(req, res) {
        try {
            const allUsers = Array.from(this.users.values()).map(user => ({
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
    }

    // Ban user (admin only)
    banUser(req, res) {
        try {
            const { userId } = req.params;
            const user = this.users.get(userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            this.users.delete(userId);

            const room = this.rooms.get(user.roomId);
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
    }

    // Get system statistics (admin only)
    getStats(req, res) {
        try {
            const stats = {
                totalRooms: this.rooms.size,
                totalUsers: this.users.size,
                totalMessages: Array.from(this.messages.values()).reduce((acc, msgs) => acc + msgs.length, 0),
                activeAdminSessions: this.adminSessions.size,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                activeRooms: Array.from(this.rooms.values()).filter(room => room.users?.size > 0).length,
                roomsCreated24h: Array.from(this.rooms.values()).filter(room => {
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
    }

    // Enable/disable maintenance mode (admin only)
    setMaintenance(req, res) {
        try {
            const { enabled, message } = req.body;

            const maintenance = {
                enabled: Boolean(enabled),
                message: message || 'System under maintenance. Please try again later.',
                enabledAt: new Date().toISOString(),
                enabledBy: req.admin.username
            };

            res.json({
                success: true,
                maintenance
            });
        } catch (error) {
            console.error('Error setting maintenance:', error);
            res.status(500).json({ error: 'Failed to set maintenance mode' });
        }
    }

    // Helper function to get last activity for a room
    getLastActivity(roomId) {
        const roomMessages = this.messages.get(roomId);
        if (!roomMessages || roomMessages.length === 0) {
            return null;
        }
        
        const lastMessage = roomMessages[roomMessages.length - 1];
        return lastMessage.createdAt;
    }
}