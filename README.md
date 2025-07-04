# CloneLingua 🗣️

A real-time voice translation application built with Next.js, OpenAI APIs, and WebSocket technology.

## 🌐 Live Demo

- **Frontend**: https://symphonious-tanuki-04d057.netlify.app
- **Backend**: Deploy your own server (see deployment section)

## 🏗️ Architecture

### Hybrid Deployment
- **Frontend**: Static site on Netlify
- **Backend**: Self-hosted real-time server
- **Communication**: HTTP APIs + WebSocket for real-time features

### Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **AI**: OpenAI GPT-4o-mini, Whisper, TTS
- **Real-time**: WebSocket for audio streaming

## 🚀 Quick Start

### Frontend (Auto-deployed via Netlify)
```bash
# Clone repository
git clone your-repo-url
cd clonelingua

# Install dependencies
npm install

# Run locally
npm run dev
```

### Backend (Real-time Server)
```bash
# Setup server
./setup-server.sh

# Start development server
cd server
npm run dev

# Or use deployment script
./deploy.sh local
```

## 📦 Deployment

### Option 1: Railway (Recommended)
```bash
cd server
./deploy.sh railway
```

### Option 2: Heroku
```bash
cd server
./deploy.sh heroku
```

### Option 3: Docker
```bash
cd server
./deploy.sh docker
```

### Option 4: VPS
```bash
cd server
./deploy.sh vps
# Follow the generated instructions
```

## 🔧 Configuration

### Environment Variables

**Frontend (Netlify)**:
```env
OPENAI_API_KEY=sk-your-key
NEXT_PUBLIC_REALTIME_SERVER_URL=wss://your-server.com
```

**Backend (Server)**:
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://symphonious-tanuki-04d057.netlify.app
OPENAI_API_KEY=sk-your-key
ALLOWED_ORIGINS=https://symphonious-tanuki-04d057.netlify.app
```

## 🎯 Features

### Core Features
- ✅ Real-time voice transcription
- ✅ Text-to-speech synthesis
- ✅ Multi-language chat interface
- ✅ WebSocket real-time communication
- ✅ Optimized OpenAI API usage

### Real-time Features (WebSocket)
- ✅ Live audio streaming
- ✅ Multi-language room support
- ✅ Connection management
- ✅ Auto-reconnection
- 🔄 Voice Activity Detection (planned)
- 🔄 Real-time translation (planned)

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks

# Backend
npm run server:dev      # Start server in dev mode
npm run server:start    # Start server in production
npm run server:deploy   # Deploy server

# Full setup
npm run setup           # Setup entire project
```

## 🔄 CI/CD

### Automatic Deployment
- **Frontend**: Auto-deploys to Netlify on push to main
- **Backend**: Deploy manually or via GitHub Actions

### GitHub Actions
- ✅ Frontend deployment to Netlify
- ✅ Server deployment to Railway
- ✅ Type checking and linting
- ✅ Health checks

## 🌍 Multi-Platform Support

### Frontend Hosting
- ✅ Netlify (current)
- ✅ Vercel (compatible)
- ✅ GitHub Pages (compatible)

### Backend Hosting
- ✅ Railway (recommended)
- ✅ Heroku
- ✅ DigitalOcean VPS
- ✅ AWS EC2
- ✅ Docker containers

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

---

Made with ❤️ using OpenAI APIs and modern web technologies
