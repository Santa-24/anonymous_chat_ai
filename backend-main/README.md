# AnonChat — Backend

Real-time anonymous chat with Socket.IO, Express, and Groq AI.

---

## 📁 File Structure

```
anonchat-backend/
├── server.js                    # Entry point
├── socket.js                    # All Socket.IO real-time logic
├── package.json
├── .env                         # Environment variables (never commit)
├── .gitignore
│
├── routes/
│   ├── admin.routes.js          # /api/admin/*
│   ├── room.routes.js           # /api/rooms/*
│   └── message.routes.js        # /api/messages/*
│
├── controllers/
│   ├── admin.controller.js      # Stats, rooms list, broadcast, delete
│   ├── room.controller.js       # Room info, list, delete
│   └── message.controller.js    # Get/delete/clear messages
│
├── middlewares/
│   ├── globalAdmin.js           # Global admin password auth
│   ├── roomAdmin.js             # Per-room admin password auth
│   └── rateLimit.js             # express-rate-limit setup
│
└── services/
    └── ai.service.js            # Groq API integration
```

---

## 🐛 Bugs Fixed (20 total)

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `socket.js` | Used local `rooms` Map; controllers used `global.rooms` — complete disconnect | All code now shares `global.rooms` set in `server.js` |
| 2 | `socket.js` | Missing `room_joined` event emit — frontend never received room data | Added `socket.emit('room_joined', {...})` after callback |
| 3 | `socket.js` | Missing `chat_history` emit on join — no message history shown | Added `socket.emit('chat_history', room.messages.slice(-100))` |
| 4 | `socket.js` | Missing: typing, kick, lock, clear, delete_room, delete_message events | All 6 events fully implemented |
| 5 | `socket.js` | Missing AI handling (`@ai` prefix) | `handleAI()` function wired into `send_message` |
| 6 | `socket.js` | `users` stored as Array — no deduplication, size checks broken | Changed to `Map<socketId, nickname>` |
| 7 | `socket.js` | Locked room only blocked wrong password, not all joins | Locked rooms now reject ALL join attempts |
| 8 | `globalAdmin.js` | Had both `export` and `import` of itself in same file | Split: export only, import removed |
| 9 | `globalAdmin.js` | Mixed ESM `export` with CJS `module.exports` | Pure ESM throughout |
| 10 | `room_controller.js` | Used `module.exports` (CJS) in ESM project (`"type":"module"`) | Converted to `export function` |
| 11 | `message_controller.js` | Same CJS/ESM mismatch | Converted to ESM |
| 12 | `rateLimit.js` | Used `require('express-rate-limit')` in ESM project | Converted to `import` |
| 13 | `roomAdmin.js` | CJS `module.exports` in ESM project | Converted to ESM |
| 14 | `ai.service.js` | Used `require()` (CJS) | Converted to ESM `import fetch from 'node-fetch'` |
| 15 | `ai.service.js` | Read `OPENAI_API_KEY` but `.env` sets `GROQ_API_KEY` | Fixed to `process.env.GROQ_API_KEY` |
| 16 | `message.routes.js` | Mixed `require()` and `import` in same file | Pure ESM |
| 17 | `admin.controller.js` | `getStats` returned stub — frontend expected `totalRooms`, `totalUsers`, `totalMessages`, `uptime` | Returns real computed values from `global.rooms` |
| 18 | `admin.routes.js` | Missing `/rooms` and `/broadcast` endpoints — admin dashboard calls both | Added `GET /rooms` and `POST /broadcast` |
| 19 | `server.js` | Never set `global.rooms` or `global.io` — all controllers got `undefined` | Added `global.rooms = new Map()` and `global.io = io` before `initSocket()` |
| 20 | `server.js` | No `/api/health` endpoint — frontend `home.js` polls it for server status badge | Added `GET /api/health` |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
GLOBAL_ADMIN_PASSWORD=superadmin@123
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=production
```

> ⚠️ **Never commit `.env` to Git.** Add it to `.gitignore`.

---

## 🚀 Deploy to Render

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/anonchat-backend.git
git push -u origin main
```

### Step 2 — Create a Web Service on Render

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter) |

### Step 3 — Add Environment Variables on Render

In your Render service → **Environment** tab, add:

```
GLOBAL_ADMIN_PASSWORD = superadmin@123
GROQ_API_KEY          = gsk_your_actual_key
NODE_ENV              = production
```

> Do NOT add `PORT` — Render sets it automatically.

### Step 4 — Update Frontend Config

In `js/config.js`, set your Render URL:

```js
return 'https://YOUR-SERVICE-NAME.onrender.com';
```

### Step 5 — Deploy Frontend

Host the frontend folder (the HTML/JS/CSS files) on:
- **Vercel** (recommended): `vercel deploy`
- **Netlify**: drag and drop the folder
- **GitHub Pages**: push to `gh-pages` branch

---

## 🔌 API Reference

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server health check |
| GET | `/api/rooms/:roomId` | Check if room exists / get info |

### Global Admin (requires `x-admin-password` header)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Total rooms, users, messages, uptime |
| GET | `/api/admin/rooms` | All active rooms with details |
| POST | `/api/admin/broadcast` | Broadcast message to all rooms |
| DELETE | `/api/admin/rooms/:roomId` | Force-delete a room |
| GET | `/api/messages/:roomId` | Get room message history |
| DELETE | `/api/messages/:roomId/clear` | Clear all messages in room |
| DELETE | `/api/messages/:roomId/:messageId` | Delete specific message |

---

## 🔌 Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname, adminPassword, enableAI }` | Create a new room |
| `join_room` | `{ roomId, nickname, adminPassword }` | Join existing room |
| `send_message` | `{ text }` | Send a message (prefix `@ai ` for AI) |
| `typing` | `{ isTyping }` | Typing indicator |
| `delete_message` | `{ messageId }` | Admin: delete message |
| `kick_user` | `{ nickname }` | Admin: kick user |
| `toggle_lock` | — | Admin: lock/unlock room |
| `clear_chat` | — | Admin: clear all messages |
| `delete_room` | — | Admin: delete room |

### Server → Client
| Event | Description |
|-------|-------------|
| `room_joined` | Room info after create/join |
| `chat_history` | Past messages on join |
| `message` | New message (types: `chat`, `system`, `broadcast`, `ai`, `ai_thinking`) |
| `user_list` | Updated user array |
| `user_typing` | Typing indicator |
| `message_deleted` | Message removed |
| `chat_cleared` | All messages cleared |
| `room_locked` | Lock state changed |
| `room_deleted` | Room was deleted |
| `kicked` | You were kicked |
| `stats_update` | Admin dashboard refresh trigger |
