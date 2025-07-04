#!/bin/bash

# CloneLingua Linode Deployment Script
# This script helps deploy the app with IP-based configuration

echo "🚀 CloneLingua Linode Deployment"
echo "================================"

# Get server IP (replace with your actual IP)
SERVER_IP="172.238.96.143"
echo "📡 Using server IP: $SERVER_IP"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    cat > .env.local << EOF
# Local environment configuration for development
NEXT_PUBLIC_REALTIME_SERVER_URL=ws://$SERVER_IP:3001
EOF
    echo "✅ Created .env.local"
else
    echo "✅ .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

# Start backend server
echo "🔧 Starting backend server..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Test backend
echo "🧪 Testing backend connection..."
if curl -s http://$SERVER_IP:3001/health > /dev/null; then
    echo "✅ Backend is running and healthy!"
else
    echo "❌ Backend connection failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend
echo "🌐 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "
🎉 Deployment successful!

📍 Services:
   Backend:  http://$SERVER_IP:3001
   Frontend: http://localhost:3000
   Health:   http://$SERVER_IP:3001/health

💡 To stop services:
   kill $BACKEND_PID $FRONTEND_PID

🔗 For production deployment:
   - Set up SSL certificates (see server/ssl-setup.md)
   - Update Netlify environment variables
   - Use wss:// instead of ws:// for secure connections
"

# Keep script running
wait