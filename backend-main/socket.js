import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

export function initializeSocket(io, rooms, users, messages, adminSessions) {
    // Middleware for socket authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                socket.adminData = decoded;
            } catch (error) {
                // Invalid token, not an admin
            }
        }
        next();
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join_room', async (data) => {
            const { roomId, username, isAdmin, adminToken } = data;
            
            // Validate room
            if (!rooms.has(roomId)) {
                socket.emit('error', { message: 'Room does not exist' });
                return;
            }

            const room = rooms.get(roomId);
            
            // Check if room is locked
            if (room.locked && !isAdmin) {
                socket.emit('error', { message: 'Room is locked' });
                return;
            }

            // Generate user ID
            const userId = `${roomId}_${username}_${uuidv4().slice(0, 8)}`;
            
            // Store user data
            const user = {
                id: userId,
                username,
                roomId,
                socketId: socket.id,
                isAdmin: isAdmin || false,
                joinedAt: new Date().toISOString(),
                lastActive: new Date().toISOString()
            };

            users.set(userId, user);
            socket.userId = userId;
            socket.roomId = roomId;

            // Join socket room
            socket.join(roomId);

            // Add user to room
            if (!room.users) room.users = new Set();
            room.users.add(userId);

            // Send welcome message
            socket.emit('room_joined', {
                room,
                userId,
                messages: messages.get(roomId) || []
            });

            // Notify others in the room
            socket.to(roomId).emit('user_joined', {
                user: { id: userId, username, isAdmin: user.isAdmin }
            });

            // Send updated online users list
            updateOnlineUsers(roomId);
        });

        socket.on('message', async (data) => {
            const { text, requestAI } = data;
            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            if (!user) return;

            // Create message
            const message = {
                id: uuidv4(),
                roomId,
                sender: user.username,
                text: text.trim(),
                createdAt: new Date().toISOString(),
                isAI: false
            };

            // Store message
            if (!messages.has(roomId)) messages.set(roomId, []);
            messages.get(roomId).push(message);

            // Broadcast to room
            io.to(roomId).emit('message', { message });

            // Update user last active
            user.lastActive = new Date().toISOString();

            // Handle AI request if enabled and room has AI
            if (requestAI && rooms.get(roomId)?.aiEnabled) {
                // In a real implementation, you would call an AI service here
                // For now, simulate AI response
                setTimeout(() => {
                    const aiResponse = {
                        id: uuidv4(),
                        roomId,
                        sender: 'AI Assistant',
                        text: `I understand you said: "${text}". This is a simulated AI response.`,
                        createdAt: new Date().toISOString(),
                        isAI: true
                    };

                    if (!messages.has(roomId)) messages.set(roomId, []);
                    messages.get(roomId).push(aiResponse);

                    io.to(roomId).emit('message', { message: aiResponse });
                }, 1000);
            }
        });

        socket.on('delete_message', (data) => {
            const { messageId } = data;
            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            const room = rooms.get(roomId);
            const roomMessages = messages.get(roomId);

            if (!roomMessages) return;

            // Find message
            const messageIndex = roomMessages.findIndex(m => m.id === messageId);
            if (messageIndex === -1) return;

            const message = roomMessages[messageIndex];

            // Check permissions: user must be room admin or message sender
            const canDelete = user.isAdmin || message.sender === user.username;
            if (!canDelete) {
                socket.emit('error', { message: 'You do not have permission to delete this message' });
                return;
            }

            // Remove message
            roomMessages.splice(messageIndex, 1);

            // Broadcast deletion
            io.to(roomId).emit('message_deleted', { messageId });
        });

        socket.on('clear_chat', () => {
            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            if (!user || !user.isAdmin) {
                socket.emit('error', { message: 'Only room admin can clear chat' });
                return;
            }

            // Clear messages for this room
            messages.set(roomId, []);

            // Broadcast clear
            io.to(roomId).emit('chat_cleared');
        });

        socket.on('kick_user', (data) => {
            const { userId: targetUserId } = data;
            const adminUserId = socket.userId;
            const roomId = socket.roomId;

            if (!adminUserId || !roomId) return;

            const adminUser = users.get(adminUserId);
            if (!adminUser || !adminUser.isAdmin) {
                socket.emit('error', { message: 'Only room admin can kick users' });
                return;
            }

            const targetUser = users.get(targetUserId);
            if (!targetUser || targetUser.roomId !== roomId) return;

            // Get target user's socket
            const targetSocket = io.sockets.sockets.get(
                Array.from(io.sockets.sockets.values())
                    .find(s => s.userId === targetUserId)?.id
            );

            // Notify target user
            if (targetSocket) {
                targetSocket.emit('user_kicked', { 
                    userId: targetUserId,
                    username: targetUser.username
                });
                targetSocket.leave(roomId);
                targetSocket.disconnect();
            }

            // Remove user from data structures
            users.delete(targetUserId);
            const room = rooms.get(roomId);
            if (room?.users) room.users.delete(targetUserId);

            // Notify room
            io.to(roomId).emit('user_kicked', {
                userId: targetUserId,
                username: targetUser.username
            });

            updateOnlineUsers(roomId);
        });

        socket.on('toggle_ai', () => {
            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            if (!user || !user.isAdmin) {
                socket.emit('error', { message: 'Only room admin can toggle AI' });
                return;
            }

            const room = rooms.get(roomId);
            if (!room) return;

            room.aiEnabled = !room.aiEnabled;

            io.to(roomId).emit('ai_toggled', {
                enabled: room.aiEnabled
            });
        });

        socket.on('lock_room', () => {
            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            if (!user || !user.isAdmin) {
                socket.emit('error', { message: 'Only room admin can lock room' });
                return;
            }

            const room = rooms.get(roomId);
            if (!room) return;

            room.locked = true;

            io.to(roomId).emit('room_locked');
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);

            const userId = socket.userId;
            const roomId = socket.roomId;

            if (!userId || !roomId) return;

            const user = users.get(userId);
            if (!user) return;

            // Remove user from room
            const room = rooms.get(roomId);
            if (room?.users) {
                room.users.delete(userId);
            }

            // Remove user
            users.delete(userId);

            // Notify room if user was in a room
            if (roomId) {
                io.to(roomId).emit('user_left', {
                    userId,
                    username: user.username
                });
                updateOnlineUsers(roomId);
            }
        });
    });

    function updateOnlineUsers(roomId) {
        const room = rooms.get(roomId);
        if (!room || !room.users) return;

        const onlineUsers = Array.from(room.users)
            .map(userId => {
                const user = users.get(userId);
                if (!user) return null;
                return {
                    id: user.id,
                    username: user.username,
                    isAdmin: user.isAdmin,
                    lastActive: user.lastActive
                };
            })
            .filter(user => user !== null);

        io.to(roomId).emit('online_users', { users: onlineUsers });
    }

    // Clean up inactive rooms (24-hour expiry)
    setInterval(() => {
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        for (const [roomId, room] of rooms.entries()) {
            if (new Date(room.createdAt) < twentyFourHoursAgo) {
                // Delete room if inactive for 24 hours
                rooms.delete(roomId);
                messages.delete(roomId);
                
                // Disconnect all users in this room
                io.in(roomId).disconnectSockets();
                
                console.log(`Cleaned up inactive room: ${roomId}`);
            }
        }
    }, 60 * 60 * 1000); // Run every hour
}