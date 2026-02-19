# Anonymous Chat Backend with Groq AI

Real-time anonymous chat application backend with AI assistant powered by Groq.

## 🚀 Features

- ✅ **Real-time chat** using Socket.IO
- 🤖 **AI Assistant** powered by Groq (llama3-8b-8192)
- 🔐 **Room-based authentication** with admin controls
- 👥 **User management** (kick, ban, typing indicators)
- 📊 **Global admin dashboard** with statistics
- 🔒 **Room locking** and moderation
- 💬 **Message history** and deletion

## 📋 Prerequisites

- Node.js 18.x or higher
- A Groq API key (free from [console.groq.com](https://console.groq.com))

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your settings:
   ```env
   PORT=3000
   GLOBAL_ADMIN_PASSWORD=your_secure_password
   OPENAI_API_KEY=gsk_your_groq_api_key_here
   NODE_ENV=development
   ```

3. **Start the server:**
   
   **Development mode** (with auto-reload):
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

4. **Verify it's running:**
   ```bash
   curl http://localhost:3000/health
   ```

## 🤖 How the Groq AI Works

The backend uses the **OpenAI SDK** but points to **Groq's API** instead:

```javascript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",  // Groq endpoint
});
```

### AI Response Triggers

The AI assistant responds when:
- Message contains "ai" or "assistant" (case-insensitive)
- Message ends with "?" (questions)
- 30% random chance on any other message

### AI Model

Using **llama3-8b-8192** from Groq:
- ⚡ Fast (typically <1s response)
- 🆓 Free tier available
- 📝 8,192 token context window

### Conversation Context

The AI maintains context using the last 5 messages in each room's `conversationHistory`.

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status and configuration.

### Statistics
```
GET /api/stats
```
Returns global statistics (rooms, users, messages).

### Room List
```
GET /api/rooms
```
Returns list of active rooms.

### Admin Verification
```
POST /api/admin/verify
Body: { "password": "your_admin_password" }
```
Verifies global admin credentials.

## 🔌 Socket.IO Events

### Client → Server

| Event | Description | Data |
|-------|-------------|------|
| `create-room` | Create new room | `{username, aiEnabled, adminPassword}` |
| `join-room` | Join existing room | `{roomId, username}` |
| `send-message` | Send chat message | `{text}` |
| `typing` | Typing indicator | `{isTyping: boolean}` |
| `toggle-lock` | Lock/unlock room | `{adminPassword}` |
| `kick-user` | Kick user (admin) | `{userId, adminPassword}` |
| `clear-chat` | Clear all messages | `{adminPassword}` |
| `delete-message` | Delete message | `{messageId, adminPassword}` |
| `global-broadcast` | Global announcement | `{message, password}` |

### Server → Client

| Event | Description | Data |
|-------|-------------|------|
| `room-created` | Room creation success | `{roomId, userId, username, isAdmin}` |
| `room-joined` | Join success | `{roomId, userId, username, isAdmin, messages}` |
| `new-message` | New message | `{id, text, username, userId, isAI, timestamp}` |
| `user-list` | Updated user list | `[{id, username, isAdmin, joinedAt}]` |
| `typing` | Someone typing | `{username, isTyping}` |
| `room-locked` | Room lock status | `{locked: boolean}` |
| `kicked` | User was kicked | - |
| `chat-cleared` | Chat was cleared | - |
| `message-deleted` | Message deleted | `{messageId}` |
| `error` | Error occurred | `{message}` |

## 🎯 AI Configuration

### Change AI Model

Edit `server.js` line 52:

```javascript
const completion = await openai.chat.completions.create({
  model: "llama3-8b-8192",  // Options: llama3-70b-8192, mixtral-8x7b-32768
  messages: messages,
  max_tokens: 300,
  temperature: 0.7,
});
```

### Available Groq Models

| Model | Speed | Quality | Context |
|-------|-------|---------|---------|
| `llama3-8b-8192` | ⚡⚡⚡ Fast | Good | 8K tokens |
| `llama3-70b-8192` | ⚡⚡ Medium | Better | 8K tokens |
| `mixtral-8x7b-32768` | ⚡ Slower | Best | 32K tokens |

### Adjust AI Behavior

Edit the system prompt (line 42 in `server.js`):

```javascript
{
  role: "system",
  content: "You are a helpful AI assistant in a chat room. Be concise, friendly, and helpful. Keep responses under 200 words."
}
```

### Change Response Triggers

Edit line 215 in `server.js`:

```javascript
const shouldRespond = 
  data.text.toLowerCase().includes('ai') ||
  data.text.toLowerCase().includes('assistant') ||
  data.text.includes('?') ||
  Math.random() < 0.3;  // Change this probability (0.3 = 30%)
```

## 🔐 Security Notes

1. **Never commit `.env` to Git** - it's in `.gitignore`
2. **Change `GLOBAL_ADMIN_PASSWORD`** before deployment
3. **Use HTTPS/WSS in production** for encrypted connections
4. **Rate limit** the API in production
5. **Rotate Groq API keys** periodically

## 🌐 Deployment

### Railway.app

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Set environment variables:
   ```bash
   railway variables set OPENAI_API_KEY=gsk_your_key
   railway variables set GLOBAL_ADMIN_PASSWORD=your_password
   ```

### Heroku

1. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=gsk_your_key
   heroku config:set GLOBAL_ADMIN_PASSWORD=your_password
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t chat-backend .
docker run -p 3000:3000 --env-file .env chat-backend
```

## 🐛 Troubleshooting

### AI Not Responding

1. **Check API key:**
   ```bash
   echo $OPENAI_API_KEY
   ```

2. **Test Groq connection:**
   ```bash
   curl https://api.groq.com/openai/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

3. **Check server logs** for errors

### CORS Issues

If frontend can't connect, add your frontend URL to CORS config in `server.js`:

```javascript
const io = socketIo(server, {
  cors: {
    origin: "https://your-frontend.com",  // Your frontend URL
    methods: ["GET", "POST"]
  }
});
```

### Port Already in Use

Change the port in `.env`:
```env
PORT=3001
```

## 📊 Monitoring

### Check Server Health
```bash
curl http://localhost:3000/health
```

### View Statistics
```bash
curl http://localhost:3000/api/stats
```

### View Active Rooms
```bash
curl http://localhost:3000/api/rooms
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT

## 👨‍💻 Author

**Santanu Barik**
- BCA | Web Developer
- Cloud & Backend Enthusiast

---

**Need help?** Open an issue on GitHub or check the [Groq Documentation](https://console.groq.com/docs).