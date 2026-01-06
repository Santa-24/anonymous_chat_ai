import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'anonymous-chat-secret-key-change-in-production';

export function verifyGlobalAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        if (!decoded.isGlobalAdmin) {
            return res.status(403).json({ error: 'Not authorized as global admin' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

export function isGlobalAdminForSocket(socket) {
    try {
        const token = socket.handshake.auth.token;
        if (!token) return false;

        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded.isGlobalAdmin === true;
    } catch (error) {
        return false;
    }
}