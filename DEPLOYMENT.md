# CloneLingua Hybrid Deployment Guide

## Architecture Overview

**Frontend (Netlify):**
- Next.js static site
- Traditional API routes (`/api/*`)
- Static assets and UI

**Backend (Self-hosted):**
- Node.js WebSocket server
- Real-time audio streaming
- OpenAI Realtime API integration

## Deployment Steps

### 1. Deploy Frontend to Netlify

```bash
# Build and deploy
npm run build
# Push to GitHub and connect to Netlify
```

**Netlify Configuration:**
- Build command: `npm run build`
- Publish directory: `.next`
- Environment variable: `NEXT_PUBLIC_REALTIME_SERVER_URL`

### 2. Deploy Backend Server

#### Option A: Cloud VPS (Recommended)
```bash
# On your VPS
git clone your-repo
cd clonelingua/server
npm install
cp .env.example .env
# Edit .env with your values
npm start
```

#### Option B: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
cd server
railway deploy
```

#### Option C: Local + ngrok (Development)
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Expose with ngrok
ngrok http 3001
```

### 3. Configure Environment Variables

**Netlify Environment Variables:**
```
NEXT_PUBLIC_REALTIME_SERVER_URL=wss://your-server.com
OPENAI_API_KEY=sk-your-key
```

**Server Environment Variables:**
```
PORT=3001
FRONTEND_URL=https://your-app.netlify.app
OPENAI_API_KEY=sk-your-key
ALLOWED_ORIGINS=https://your-app.netlify.app
```

### 4. Update URLs

1. **In `netlify.toml`:**
   ```toml
   NEXT_PUBLIC_REALTIME_SERVER_URL = "wss://your-actual-server.com"
   ```

2. **In server `.env`:**
   ```env
   FRONTEND_URL=https://your-actual-netlify-app.netlify.app
   ```

## Features by Platform

### ✅ Netlify (Frontend)
- Static site hosting
- Traditional API routes
- CDN distribution
- SSL certificates
- Form handling

### ✅ Self-hosted (Backend)
- WebSocket connections
- Real-time audio streaming
- OpenAI Realtime API
- Custom server logic
- File uploads

## Production Checklist

### Frontend (Netlify)
- [ ] Environment variables configured
- [ ] Build command working
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Performance optimized

### Backend (Self-hosted)
- [ ] Server deployed and running
- [ ] SSL certificate configured
- [ ] Firewall rules set
- [ ] PM2 process manager
- [ ] Log monitoring
- [ ] Health check endpoint
- [ ] Backup strategy

## Monitoring

### Frontend
- Netlify Analytics
- Browser console errors
- Performance metrics

### Backend
- Server logs
- WebSocket connection count
- Health check endpoint: `/health`
- Error tracking

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check `ALLOWED_ORIGINS` in server config
   - Verify frontend URL matches exactly

2. **WebSocket Connection Failed:**
   - Ensure server is running
   - Check firewall rules
   - Verify SSL/TLS configuration

3. **Build Failures:**
   - Check Node.js version
   - Verify environment variables
   - Clear cache and rebuild

### Debug Commands

```bash
# Check server health
curl https://your-server.com/health

# Test WebSocket connection
wscat -c wss://your-server.com

# Check Netlify build logs
netlify logs

# Monitor server logs
pm2 logs clonelingua-server
```

## Scaling Considerations

### Frontend
- Netlify auto-scales
- CDN handles global traffic
- No server management needed

### Backend
- Consider load balancing
- Implement Redis for sessions
- Use cluster mode for Node.js
- Monitor resource usage

## Cost Estimates

### Netlify (Frontend)
- Free tier: 100GB bandwidth
- Pro: $19/month for more features

### Self-hosted (Backend)
- VPS: $5-20/month
- Railway: $5-10/month
- AWS/GCP: Variable based on usage

## Security

### Frontend
- HTTPS enforced
- Headers configured
- No sensitive data in client

### Backend
- SSL/TLS certificates
- CORS properly configured
- Rate limiting
- Input validation
- Environment variables secured