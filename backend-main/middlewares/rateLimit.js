import rateLimit from 'express-rate-limit';

// Rate limiter for room creation
export const createRoomLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 room creations per 15 minutes
    message: 'Too many rooms created from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for messages
export const messageLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 messages per minute
    message: 'You are sending messages too quickly. Please slow down.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for admin endpoints
export const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 admin requests per 15 minutes
    message: 'Too many admin requests from this IP.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for socket connections
export const socketConnectionLimiter = (io) => {
    const connectionCounts = new Map();
    const timeWindow = 60 * 1000; // 1 minute
    const maxConnections = 10; // Max connections per IP per minute

    return (socket, next) => {
        const ip = socket.handshake.address;
        const now = Date.now();
        
        if (!connectionCounts.has(ip)) {
            connectionCounts.set(ip, []);
        }
        
        const connections = connectionCounts.get(ip);
        
        // Remove connections older than time window
        const recentConnections = connections.filter(time => now - time < timeWindow);
        
        if (recentConnections.length >= maxConnections) {
            return next(new Error('Too many connections from this IP. Please try again later.'));
        }
        
        recentConnections.push(now);
        connectionCounts.set(ip, recentConnections);
        
        next();
    };
};