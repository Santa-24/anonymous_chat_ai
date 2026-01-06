# Anonymous Multi-Room Chat Platform

A real-time, anonymous, multi-room chat application with two-level admin control system.

## Features

### 🎯 Core Features
- **Anonymous Chat**: No login required, random usernames
- **Room-Based**: Create/join private chat rooms
- **Real-time**: WebSocket-based instant messaging
- **Temporary Admin**: Room creator becomes admin for that room
- **Global Admin**: System-wide control panel

### 👥 User Roles
1. **Normal User**: Join rooms, send messages
2. **Room Admin (Temporary)**: Delete messages, clear chat, kick users, toggle AI
3. **Global Admin (Super Admin)**: Full system control, delete any room, ban users, maintenance mode

### 🛡️ Admin Powers
**Room Admin (Temporary):**
- ✅ Delete any message in their room
- ✅ Clear entire room chat
- ✅ Kick users from their room
- ✅ Toggle AI assistant on/off
- ✅ Lock room (prevent new joins)
- ❌ Cannot delete room permanently
- ❌ Cannot affect other rooms

**Global Admin (Super Admin):**
- ✅ View all rooms and users
- ✅ Delete any room
- ✅ Ban any user
- ✅ Enable/disable maintenance mode
- ✅ View system statistics
- ✅ Broadcast messages to all/specific rooms

## 🏗️ Architecture

### Frontend
- **HTML/CSS/JavaScript** with Tailwind CSS
- **Socket.IO Client** for real-time communication
- **No frameworks** - vanilla JS for simplicity

### Backend
- **Node.js** with **Express.js**
- **Socket.IO** for WebSocket communication
- **JWT** for authentication
- **In-memory storage** (can be replaced with Redis/DB)

## 📁 Project Structure

anonymous-chat-platform/
├── frontend/
│ ├── index.html # Home page - create/join rooms
│ ├── room.html # Chat room interface
│ ├── admin.html # Global admin panel
│ ├── js/
│ │ ├── config.js # Backend URL configuration
│ │ ├── home.js # Home page logic
│ │ ├── room.js # Room chat logic
│ │ └── admin.js # Admin panel logic
│ ├── css/
│ │ └── style.css # Custom styles
│ └── README.md
├── backend/
│ ├── server.js # Main server file
│ ├── socket.js # Socket.IO setup
│ ├── routes/ # API routes
│ ├── controllers/ # Route controllers
│ ├── middlewares/ # Auth & rate limiting
│ ├── services/ # AI service
│ ├── .env # Environment variables
│ ├── package.json # Dependencies
│ ├── Procfile # Deployment config
│ └── README.md
└── README.md # This file


## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd anonymous-chat-platform

