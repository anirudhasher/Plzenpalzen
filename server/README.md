# CloneLingua Real-time Server

This is the WebSocket server for CloneLingua's real-time voice translation features.

## Architecture

- **Frontend**: Deployed on Netlify (static site)
- **Backend**: Self-hosted Node.js server (this server)
- **Communication**: WebSocket for real-time audio, HTTP for traditional API calls

## Setup

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Run the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Deployment Options

### Option 1: Cloud VPS (Recommended)
- Deploy to DigitalOcean, AWS EC2, or similar
- Use PM2 for process management
- Configure reverse proxy with Nginx

### Option 2: Local Development
- Run locally during development
- Use ngrok to expose to Netlify frontend

### Option 3: Railway/Heroku
- Deploy to Railway or Heroku
- Configure environment variables
- Use their WebSocket support

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Your Netlify URL | `https://your-app.netlify.app` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000,https://your-app.netlify.app` |

## Features

- ✅ Real-time audio streaming
- ✅ Multi-language room support
- ✅ Connection management
- ✅ Heartbeat monitoring
- ✅ Graceful shutdown
- 🔄 OpenAI Realtime API integration (pending)
- 🔄 Voice Activity Detection (pending)

## API Endpoints

- `GET /health` - Health check and connection stats

## WebSocket Events

### Client → Server
- `subscribe-language` - Join language room
- `stream-audio` - Send audio data
- `translate-audio` - Request translation
- `ping` - Heartbeat

### Server → Client
- `audio-stream` - Receive audio from others
- `translation-result` - Translation response
- `user-joined` - User joined room
- `user-left` - User left room
- `pong` - Heartbeat response

## Production Checklist

- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure process management (PM2)
- [ ] Set up backup and recovery
- [ ] Configure rate limiting
- [ ] Set up health checks