# Setup Guide - Anonymous Chat Platform

Complete setup instructions for getting the Anonymous Chat Platform running on your local machine or deploying to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Configuration](#configuration)
5. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
  - Download from [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **npm** (comes with Node.js)
  - Verify: `npm --version`

- **Git** (optional, for version control)
  - Download from [git-scm.com](https://git-scm.com/)

- **A modern web browser**
  - Chrome, Firefox, Safari, or Edge

- **A code editor** (recommended)
  - VS Code, Sublime Text, or your preferred editor

## Local Development Setup

### Quick Start (Linux/Mac)

```bash
# Make the startup script executable (if not already)
chmod +x start.sh

# Run the startup script
./start.sh
```

This will automatically:
1. Install backend dependencies
2. Create `.env` file from template
3. Start the backend server
4. Start the frontend server (if Python is available)

### Manual Setup

#### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend-main

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and update values
nano .env  # or use your preferred editor
```

**.env configuration:**
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
GLOBAL_ADMIN_PASSWORD=your-secure-password-here
```

**Start the backend:**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend will be available at `http://localhost:3000`

#### Step 2: Frontend Setup

**Option A: Using Python**
```bash
cd frontend-main
python -m http.server 5500
# or
python3 -m http.server 5500
```

**Option B: Using Node.js http-server**
```bash
cd frontend-main
npx http-server -p 5500
```

**Option C: Using VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Open `frontend-main/index.html`
3. Right-click and select "Open with Live Server"

The frontend will be available at `http://localhost:5500`

#### Step 3: Access the Application

Open your browser and navigate to:
- **Main App**: `http://localhost:5500`
- **Admin Panel**: `http://localhost:5500/admin.html`
- **Backend Health**: `http://localhost:3000/health`

## Production Deployment

### Backend Deployment

#### Option 1: Heroku

```bash
# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set GLOBAL_ADMIN_PASSWORD=your-secure-password
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git subtree push --prefix backend-main heroku main

# Or if the repo root is backend-main:
git push heroku main
```

#### Option 2: Railway

1. Connect your GitHub repository
2. Select the `backend-main` directory as root
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

#### Option 3: DigitalOcean App Platform

1. Create new app from GitHub repo
2. Select Node.js environment
3. Set build command: `npm install`
4. Set run command: `npm start`
5. Add environment variables
6. Deploy

#### Option 4: AWS EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repository
git clone your-repo-url
cd backend-main

# Install dependencies
npm install

# Create .env file
nano .env

# Install PM2 for process management
sudo npm install -g pm2

# Start the application
pm2 start server.js --name anonymous-chat

# Save PM2 configuration
pm2 save
pm2 startup
```

### Frontend Deployment

#### Option 1: Netlify

1. **Via Drag & Drop:**
   - Go to [netlify.com](https://netlify.com)
   - Drag the `frontend-main` folder to the deploy zone

2. **Via Git:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login
   netlify login
   
   # Deploy
   cd frontend-main
   netlify deploy --prod
   ```

3. **Update config.js** with production backend URL:
   ```javascript
   const CONFIG = {
     API_URL: 'https://your-backend.herokuapp.com',
     SOCKET_URL: 'https://your-backend.herokuapp.com',
     // ...
   };
   ```

#### Option 2: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend-main
vercel --prod
```

#### Option 3: GitHub Pages

1. Create a new repository or use existing
2. Push `frontend-main` contents to a branch (e.g., `gh-pages`)
3. Go to repository Settings → Pages
4. Select the branch and root directory
5. Save and wait for deployment

#### Option 4: AWS S3 + CloudFront

```bash
# Install AWS CLI
# Configure AWS credentials
aws configure

# Create S3 bucket
aws s3 mb s3://your-bucket-name

# Enable static website hosting
aws s3 website s3://your-bucket-name --index-document index.html

# Upload files
cd frontend-main
aws s3 sync . s3://your-bucket-name --acl public-read

# Create CloudFront distribution (optional, for CDN)
# Follow AWS CloudFront setup guide
```

## Configuration

### Backend Configuration

**Environment Variables:**

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 3000 | No |
| `NODE_ENV` | Environment | development | No |
| `FRONTEND_URL` | Frontend URL for CORS | * | No |
| `GLOBAL_ADMIN_PASSWORD` | Admin panel password | admin123 | Yes |

### Frontend Configuration

**config.js settings:**

```javascript
const CONFIG = {
  // Backend URLs - Update for production
  API_URL: 'http://localhost:3000',
  SOCKET_URL: 'http://localhost:3000',
  
  // Socket.IO configuration
  SOCKET_OPTIONS: {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    transports: ['websocket', 'polling']
  },
  
  // Application settings
  MAX_MESSAGE_LENGTH: 500,        // Maximum characters per message
  TYPING_TIMEOUT: 3000,           // Typing indicator timeout (ms)
  MAX_USERNAME_LENGTH: 20,        // Maximum username length
  MIN_USERNAME_LENGTH: 2,         // Minimum username length
  
  // UI settings
  DEFAULT_THEME: 'dark'           // 'dark' or 'light'
};
```

## Troubleshooting

### Backend Issues

**Problem: Port already in use**
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or change PORT in .env
PORT=3001
```

**Problem: Module not found**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Problem: Cannot connect to frontend**
```bash
# Check CORS settings in .env
FRONTEND_URL=http://localhost:5500

# Or allow all origins (development only)
FRONTEND_URL=*
```

### Frontend Issues

**Problem: Cannot connect to backend**
1. Verify backend is running: `http://localhost:3000/health`
2. Check `config.js` has correct backend URL
3. Check browser console for errors
4. Verify CORS configuration on backend

**Problem: Socket connection fails**
1. Check if WebSocket port is open
2. Verify `SOCKET_URL` in `config.js`
3. Try different transport: Set `transports: ['polling']` temporarily
4. Check for firewall/antivirus blocking WebSocket

**Problem: Room not found**
1. Backend might have restarted (rooms are in-memory)
2. Verify 6-digit Room ID is correct
3. Check backend logs for errors

### Production Issues

**Problem: HTTPS/WSS required**
- Most hosting platforms provide free SSL
- Update frontend config to use `https://` and `wss://`
- Ensure backend supports secure connections

**Problem: CORS errors in production**
```javascript
// Backend: Update CORS configuration
app.use(cors({
  origin: 'https://your-frontend-domain.com',
  credentials: true
}));
```

**Problem: WebSocket connection fails on Heroku**
- Ensure you're using WebSocket-compatible dyno
- Heroku supports WebSocket on all dyno types
- Check that Socket.IO client uses correct URL

## Testing

### Test Backend
```bash
# Health check
curl http://localhost:3000/health

# Check if room exists
curl http://localhost:3000/api/rooms/check/123456
```

### Test Frontend
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for WebSocket connection
4. Test creating and joining rooms

## Next Steps

1. **Customize the Application**
   - Modify colors in CSS variables
   - Change fonts in HTML files
   - Add new features

2. **Set Up Database** (Optional)
   - Add MongoDB for persistent storage
   - Implement Redis for scaling

3. **Add Monitoring**
   - Set up logging (Winston, Morgan)
   - Add error tracking (Sentry)
   - Monitor uptime (Uptime Robot)

4. **Enhance Security**
   - Add rate limiting
   - Implement input validation
   - Add authentication for admin panel

## Support

If you encounter issues:
1. Check this guide thoroughly
2. Review the main README.md
3. Check backend/frontend logs
4. Open an issue on GitHub

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MDN Web Docs](https://developer.mozilla.org/)

---

Happy Coding! 🚀
