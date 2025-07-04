#!/bin/bash

# CloneLingua Server Deployment Script
# Supports multiple platforms: Railway, DigitalOcean, AWS, Heroku

set -e

echo "🚀 CloneLingua Server Deployment Script"
echo "======================================="

# Check if platform is specified
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <platform>"
    echo ""
    echo "Available platforms:"
    echo "  railway     - Deploy to Railway"
    echo "  heroku      - Deploy to Heroku"
    echo "  docker      - Build Docker image"
    echo "  vps         - Generate VPS setup commands"
    echo "  local       - Start local server"
    echo ""
    exit 1
fi

PLATFORM=$1

case $PLATFORM in
    "railway")
        echo "🚂 Deploying to Railway..."
        
        # Check if Railway CLI is installed
        if ! command -v railway &> /dev/null; then
            echo "Installing Railway CLI..."
            npm install -g @railway/cli
        fi
        
        # Login and deploy
        echo "Please login to Railway:"
        railway login
        
        # Initialize project if needed
        if [ ! -f "railway.json" ]; then
            railway init
        fi
        
        # Set environment variables
        echo "Setting environment variables..."
        railway variables set NODE_ENV=production
        railway variables set FRONTEND_URL=https://symphonious-tanuki-04d057.netlify.app
        railway variables set ALLOWED_ORIGINS=https://symphonious-tanuki-04d057.netlify.app
        
        echo "⚠️  Don't forget to set OPENAI_API_KEY in Railway dashboard!"
        
        # Deploy
        railway up
        
        echo "✅ Deployment complete!"
        echo "🔗 Get your server URL from Railway dashboard"
        ;;
        
    "heroku")
        echo "🟣 Deploying to Heroku..."
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo "Please install Heroku CLI first:"
            echo "https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Login
        heroku login
        
        # Create app if needed
        read -p "Enter Heroku app name (or press enter for auto-generated): " APP_NAME
        if [ -z "$APP_NAME" ]; then
            heroku create
        else
            heroku create $APP_NAME
        fi
        
        # Set environment variables
        heroku config:set NODE_ENV=production
        heroku config:set FRONTEND_URL=https://symphonious-tanuki-04d057.netlify.app
        heroku config:set ALLOWED_ORIGINS=https://symphonious-tanuki-04d057.netlify.app
        
        echo "⚠️  Set your OpenAI API key:"
        echo "heroku config:set OPENAI_API_KEY=your_key_here"
        
        # Deploy
        git add .
        git commit -m "Deploy to Heroku" || echo "No changes to commit"
        git push heroku main
        
        echo "✅ Deployment complete!"
        ;;
        
    "docker")
        echo "🐳 Building Docker image..."
        
        # Build Docker image
        docker build -t clonelingua-server .
        
        echo "✅ Docker image built!"
        echo "Run with: docker run -p 3001:3001 --env-file .env clonelingua-server"
        ;;
        
    "vps")
        echo "🖥️  VPS Deployment Commands"
        echo "=========================="
        echo ""
        echo "1. Connect to your VPS:"
        echo "   ssh user@your-server-ip"
        echo ""
        echo "2. Install Node.js:"
        echo "   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "   sudo apt-get install -y nodejs"
        echo ""
        echo "3. Install PM2:"
        echo "   sudo npm install -g pm2"
        echo ""
        echo "4. Clone and setup:"
        echo "   git clone your-repo-url"
        echo "   cd clonelingua/server"
        echo "   npm install"
        echo "   cp .env.example .env"
        echo "   # Edit .env with your values"
        echo ""
        echo "5. Start with PM2:"
        echo "   pm2 start index.js --name clonelingua-server"
        echo "   pm2 startup"
        echo "   pm2 save"
        echo ""
        echo "6. Setup Nginx (optional):"
        echo "   sudo apt install nginx"
        echo "   # Configure reverse proxy for WebSocket"
        echo ""
        ;;
        
    "local")
        echo "🏠 Starting local server..."
        
        # Copy env if needed
        if [ ! -f .env ]; then
            cp .env.example .env
            echo "⚠️  Please edit .env with your configuration"
        fi
        
        # Install dependencies
        npm install
        
        # Start server
        npm run dev
        ;;
        
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Available platforms: railway, heroku, docker, vps, local"
        exit 1
        ;;
esac