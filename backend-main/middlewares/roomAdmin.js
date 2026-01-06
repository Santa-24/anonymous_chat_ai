import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';

export function verifyRoomAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const { roomId } = req.params;
        if (decoded.roomId !== roomId || !decoded.isRoomAdmin) {
            return res.status(403).json({ error: 'Not authorized as room admin' });
        }

        req.roomAdmin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export function isRoomAdminForSocket(socket, roomId) {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return false;

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.roomId === roomId && decoded.isRoomAdmin === true;
    } catch (error) {
        return false;
    }
}