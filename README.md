# 💬 AnonChat — Anonymous Real-Time Chat

> A fully anonymous, real-time chat application with AI integration, room management, and a global admin dashboard. No accounts. No tracking. No trace.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=flat-square&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.6-010101?style=flat-square&logo=socket.io)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)
![Groq AI](https://img.shields.io/badge/Groq-LLaMA_3.1-FF6B35?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started (Local)](#-getting-started-local)
- [Environment Variables](#-environment-variables)
- [Deploying to Render (Backend)](#-deploying-to-render-backend)
- [Deploying the Frontend](#-deploying-the-frontend)
- [API Reference](#-api-reference)
- [Socket.IO Events](#-socketio-events)
- [How It Works](#-how-it-works)
- [Admin Guide](#-admin-guide)
- [Author](#-author)

---

## 🔍 Overview

AnonChat lets anyone create a private chat room in seconds, share a 6-digit code, and start talking — with no sign-up, no email, and no stored identity. Rooms can optionally include an AI assistant powered by Groq's LLaMA 3.1. Room admins can lock rooms, kick users, clear chat, and delete rooms. A global admin dashboard provides a bird's-eye view across all active rooms.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔒 Truly Anonymous | No accounts, no emails — just a nickname |
| ⚡ Real-Time | Instant messaging and typing indicators via WebSocket |
| 🤖 AI Assistant | Invoke LLaMA 3.1 with `@ai your question` |
| 👑 Room Admin Controls | Lock room, kick users, clear chat, delete room |
| 🌐 Auto Reconnect | Automatic reconnection with exponential backoff |
| 📢 Global Broadcast | Admin can push a message to every active room |
| 🎨 Dark & Light Theme | Toggle themes, persisted via localStorage |
| 📱 Responsive UI | Works on desktop and mobile |
| 🛡️ Rate Limiting | Prevents spam and abuse |
| 💀 Ephemeral Rooms | Rooms self-destruct when all users leave |

---

## 🛠 Tech Stack

### Backend
- **Node.js** (v18+) — Runtime
- **Express.js** — HTTP API server
- **Socket.IO** — WebSocket real-time communication
- **Groq SDK** (via REST) — LLaMA 3.1 AI responses
- **node-fetch** — HTTP requests to Groq API
- **express-rate-limit** — Rate limiting middleware
- **dotenv** — Environment variable management

### Frontend
- **Vanilla HTML / CSS / JavaScript** — No framework dependencies
- **Socket.IO Client** (CDN) — Real-time connection
- **Google Fonts** — Space Grotesk + DM Mono
- **CSS Variables** — Full dark/light theme system

---

## 📁 Project Structure

```
anonchat/
│
├── 📂 backend/                        # Node.js backend (deploy to Render)
│   ├── server.js                      # Express app, HTTP server, Socket.IO init
│   ├── socket.js                      # All real-time Socket.IO event handlers
│   ├── package.json
│   ├── .env                           # Local env vars (never commit)
│   ├── .gitignore
│   │
│   ├── 📂 routes/
│   │   ├── admin.routes.js            # GET /api/admin/stats, rooms, broadcast
│   │   ├── room.routes.js             # GET /api/rooms/:roomId
│   │   └── message.routes.js         # GET/DELETE /api/messages/:roomId
│   │
│   ├── 📂 controllers/
│   │   ├── admin.controller.js        # Stats, rooms list, broadcast, delete
│   │   ├── room.controller.js         # Room info, list, force-delete
│   │   └── message.controller.js     # Fetch, delete, clear messages
│   │
│   ├── 📂 middlewares/
│   │   ├── globalAdmin.js             # x-admin-password header auth
│   │   ├── roomAdmin.js               # Per-room admin password auth
│   │   └── rateLimit.js              # Global & strict rate limiters
│   │
│   └── 📂 services/
│       └── ai.service.js              # Groq API (LLaMA 3.1) integration
│
└── 📂 frontend/                       # Static files (deploy to Vercel/Netlify)
    ├── index.html                     # Landing page — create/join room
    ├── room.html                      # Chat room UI
    ├── admin.html                     # Global admin dashboard
    └── 📂 js/
        ├── config.js                  # Backend URL config (local vs production)
        ├── utils.js                   # Shared utilities (toast, theme, store)
        ├── home.js                    # Landing page logic
        ├── room.js                    # Room/chat logic
        └── admin.js                   # Admin dashboard logic
```

---

## 🚀 Getting Started (Local)

### Prerequisites

- Node.js v18 or higher
- A free [Groq API key](https://console.groq.com) (for AI features)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/anonchat.git
cd anonchat/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `backend/` folder:

```env
PORT=3000
GLOBAL_ADMIN_PASSWORD=superadmin@123
GROQ_API_KEY=your_groq_api_key_here
NODE_ENV=development
```

### 4. Start the backend

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:3000`.

### 5. Open the frontend

Open `frontend/index.html` directly in your browser, or serve it with any static file server:

```bash
npx serve frontend/
```

> Make sure `frontend/js/config.js` has `BACKEND_URL` pointing to `http://localhost:3000` for local dev. This is the default when `window.location.hostname` is `localhost`.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`). Render sets this automatically. |
| `GLOBAL_ADMIN_PASSWORD` | ✅ Yes | Password for the global admin dashboard |
| `GROQ_API_KEY` | ✅ Yes | Your Groq API key for AI features |
| `NODE_ENV` | No | Set to `production` on Render |

> ⚠️ **Security note:** Never commit your `.env` file. It is included in `.gitignore` by default.

---

## ☁️ Deploying to Render (Backend)

### Step 1 — Push backend to GitHub

```bash
cd backend/
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/anonchat-backend.git
git push -u origin main
```

### Step 2 — Create a Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **New → Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---|---|
| **Name** | `anonchat-backend` (or any name) |
| **Runtime** | Node |
| **Region** | Closest to your users |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

### Step 3 — Add Environment Variables on Render

In your service dashboard → **Environment** tab → add:

```
GLOBAL_ADMIN_PASSWORD  →  your_secure_password
GROQ_API_KEY           →  gsk_your_actual_key
NODE_ENV               →  production
```

> Do **not** add `PORT` — Render injects it automatically.

### Step 4 — Deploy

Click **Deploy**. Render will build and launch your backend. You'll get a URL like:

```
https://anonchat-backend.onrender.com
```

> ⚠️ **Free tier note:** Render free services spin down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds. Upgrade to a paid plan for always-on performance.

---

## 🌐 Deploying the Frontend

Update `frontend/js/config.js` with your Render backend URL:

```js
// In the production return:
return 'https://anonchat-backend.onrender.com';
```

Then deploy the `frontend/` folder to any static host:

### Option A — Vercel (Recommended)

```bash
npm install -g vercel
cd frontend/
vercel deploy
```

### Option B — Netlify

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `frontend/` folder onto the dashboard
3. Done — Netlify gives you a live URL instantly

### Option C — GitHub Pages

```bash
# From the repo root
git subtree push --prefix frontend origin gh-pages
```

Then enable GitHub Pages in your repo settings, pointing to the `gh-pages` branch.

---

## 📡 API Reference

### Public Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Server health check. Returns `{ status: "ok", uptime: ... }` |
| `GET` | `/api/rooms/:roomId` | Check if a room exists and get basic info |

### Global Admin Endpoints

All admin endpoints require the header: `x-admin-password: your_password`

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Get total rooms, users, messages, and server uptime |
| `GET` | `/api/admin/rooms` | Get all active rooms with full details |
| `POST` | `/api/admin/broadcast` | Broadcast `{ message }` to every active room |
| `DELETE` | `/api/admin/rooms/:roomId` | Force-delete a room |
| `GET` | `/api/messages/:roomId` | Get message history for a room |
| `DELETE` | `/api/messages/:roomId/clear` | Clear all messages in a room |
| `DELETE` | `/api/messages/:roomId/:messageId` | Delete a specific message |

### Example Responses

**`GET /api/admin/stats`**
```json
{
  "totalRooms": 3,
  "totalUsers": 12,
  "totalMessages": 247,
  "uptime": 3842.5
}
```

**`GET /api/rooms/:roomId`**
```json
{
  "id": "482910",
  "userCount": 3,
  "locked": false,
  "enableAI": true,
  "createdAt": 1700000000000,
  "users": ["CryptoFox", "SilentWolf", "Ghost99"],
  "messageCount": 14
}
```

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ nickname, adminPassword, enableAI }` | Create a new room |
| `join_room` | `{ roomId, nickname, adminPassword }` | Join an existing room |
| `send_message` | `{ text }` | Send a message. Prefix with `@ai ` to invoke the AI |
| `typing` | `{ isTyping: true/false }` | Emit while the user is typing |
| `delete_message` | `{ messageId }` | Admin only: delete a specific message |
| `kick_user` | `{ nickname }` | Admin only: remove a user from the room |
| `toggle_lock` | _(none)_ | Admin only: toggle room locked/unlocked |
| `clear_chat` | _(none)_ | Admin only: clear all messages |
| `delete_room` | _(none)_ | Admin only: permanently delete the room |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `room_joined` | `{ roomId, nickname, isAdmin, enableAI }` | Confirms successful room entry |
| `chat_history` | `Message[]` | Last 100 messages sent on join |
| `message` | `Message` | A new incoming message |
| `user_list` | `string[]` | Updated list of online nicknames |
| `user_typing` | `{ nickname, isTyping }` | Another user's typing state |
| `message_deleted` | `{ messageId }` | A message was removed |
| `chat_cleared` | _(none)_ | All messages were cleared |
| `room_locked` | `{ locked: boolean }` | Room lock state changed |
| `room_deleted` | `{ message }` | Room was deleted — redirect away |
| `kicked` | `{ reason }` | You were kicked — redirect away |
| `stats_update` | _(none)_ | Admin dashboard should refresh data |

### Message Object Shape

```json
{
  "id": "1700000000000-abc12",
  "type": "chat",
  "nickname": "CryptoFox",
  "text": "Hello everyone!",
  "timestamp": 1700000000000,
  "isAdmin": false
}
```

Message types: `chat` · `system` · `broadcast` · `ai` · `ai_thinking`

---

## 🧠 How It Works

### Room Lifecycle

```
User fills form → socket connects → emit create_room / join_room
       ↓
Server creates room in global.rooms (Map) → emits room_joined
       ↓
User sees chat history + user list
       ↓
Messages flow in real-time via emit('message')
       ↓
Last user disconnects → room auto-deleted from memory
```

### AI Flow

```
User sends: "@ai what is the meaning of life?"
       ↓
socket.js detects @ai prefix → emits ai_thinking to room
       ↓
getAIResponse(prompt, last5messages) → Groq API → LLaMA 3.1
       ↓
AI response emitted as type: "ai" message to entire room
```

### Data Storage

All data is **in-memory only** (`global.rooms` Map). There is no database. When the server restarts or a room empties, all data is gone. This is by design — it guarantees anonymity and zero data retention.

---

## 👑 Admin Guide

### Room Admin

When you create a room, you become its admin. You can set an optional admin password — anyone who joins with the correct password and your nickname also gets admin privileges.

Room admin controls (visible in the sidebar):
- **🔒 Lock Room** — Prevents new users from joining
- **🗑️ Clear Chat** — Wipes all messages for everyone
- **💀 Delete Room** — Permanently destroys the room and kicks everyone
- **✕ Kick button** next to each username — Removes that user

### Global Admin

Navigate to `/admin.html` and enter the `GLOBAL_ADMIN_PASSWORD` from your `.env`.

Global admin can:
- View real-time stats (active rooms, online users, total messages, uptime)
- See all active rooms with user lists and message counts
- **Broadcast** a message that appears in every room simultaneously
- **Force-delete** any room

---

## 👨‍💻 Author

**Santanu Barik**
BCA · Web Developer · Cloud & Backend Enthusiast

- Built with ❤️ using Node.js, Socket.IO, and Groq AI
- Deployed on Render (backend) + Vercel (frontend)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

*"No accounts. No history. No trace. Just chat."*
