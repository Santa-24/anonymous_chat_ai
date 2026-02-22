# 🔒 AnonChat — Anonymous Real-Time Chat

A full-stack anonymous chat platform built by **Santanu Barik**.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend**: Node.js + Express
- **Real-Time**: Socket.io (WebSocket)
- **AI**: OpenAI GPT (optional)

## Project Structure
```
Anonymous_chatWebApp/
├── backend-main/     ← Node.js + Express + Socket.io
└── frontend-main/    ← Pure HTML/CSS/JS (served by backend)
```

## Quick Start

```bash
# Install dependencies
cd backend-main
npm install

# Configure environment
cp .env.example .env
nano .env  # Set your passwords & optional OpenAI key

# Start server
npm start

# Open browser
open http://localhost:3000
```

## Features
- 🔒 Truly anonymous — no accounts needed
- ⚡ Real-time messaging with Socket.io
- 🤖 AI assistant (@ai command)
- 👑 Room admin controls (lock, kick, clear, delete)
- 📊 Global admin dashboard
- 📢 Broadcast to all rooms
- 🌙 Dark/Light theme
- 🔗 Auto-reconnect on disconnect
- 📱 Mobile responsive

## Default Credentials
- **Global Admin Password**: `admin123` (change in `.env`)
- **Room Admin Password**: Set when creating a room

## Author
Santanu Barik | BCA | Web Developer | Cloud & Backend Enthusiast
