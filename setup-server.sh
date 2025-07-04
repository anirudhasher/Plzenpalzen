#!/bin/bash

echo "🚀 Setting up CloneLingua Real-time Server..."

# Navigate to server directory
cd server

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
echo "⚙️  Setting up environment..."
cp .env.example .env

echo "✅ Server setup complete!"
echo ""
echo "Next steps:"
echo "1. cd server"
echo "2. npm run dev (for development)"
echo "3. npm start (for production)"
echo ""
echo "🌐 Your Netlify app: https://symphonious-tanuki-04d057.netlify.app"
echo "🔗 Server will run on: http://localhost:3001"
echo "💡 Health check: http://localhost:3001/health"
echo ""
echo "For production deployment, consider:"
echo "- Railway: https://railway.app"
echo "- DigitalOcean: https://digitalocean.com"
echo "- AWS EC2: https://aws.amazon.com/ec2"