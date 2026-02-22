import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';

import adminRoutes from './routes/admin.routes.js';
import roomRoutes from './routes/room.routes.js';
import messageRoutes from './routes/message.routes.js';
import initSocket from './socket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Global shared state ───────────────────────────────────────
// All rooms stored here, accessible by socket.js AND controllers
global.rooms = new Map();
global.startTime = Date.now();

// ─── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-password', 'x-room-password']
}));

app.use(express.json());

// ─── Health check (frontend polls this) ───────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/admin', adminRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// ─── 404 fallback ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Socket.IO ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Make io globally accessible for controllers
global.io = io;

initSocket(io);

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ AnonChat backend running on port ${PORT}`);
});
