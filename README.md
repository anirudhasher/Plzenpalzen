# CloneLingua 🗣️

A frontend-only voice translation application built with Next.js and OpenAI APIs for Netlify deployment.

## 🌐 Live Demo

- **Frontend**: https://symphonious-tanuki-04d057.netlify.app

## 🏗️ Architecture

### Frontend-Only Deployment
- **Frontend**: Static site on Netlify with direct OpenAI API integration
- **Communication**: Direct HTTPS calls to OpenAI APIs
- **No Backend Required**: Simple, secure, and cost-effective

### Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4, Whisper, TTS
- **Deployment**: Netlify static hosting

## 🚀 Quick Start

### Setup and Development
```bash
# Clone repository
git clone your-repo-url
cd clonelingua

# Install dependencies
npm install

# Run locally
npm run dev
```

## 📦 Deployment

### Netlify (Recommended)
The application is configured for automatic deployment to Netlify:
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

## 🔧 Configuration

### Environment Variables

**Frontend (Netlify)**:
```env
OPENAI_API_KEY=sk-your-key
```

Set this in your Netlify dashboard under Site Settings > Environment Variables.

## 🎯 Features

### Core Features
- ✅ Real-time voice transcription via OpenAI Whisper
- ✅ Text-to-speech synthesis via OpenAI TTS
- ✅ Multi-language chat interface
- ✅ Streaming responses from GPT-4
- ✅ Client-side memory management
- ✅ Quick reply suggestions

### Languages Supported
- 🇹🇭 Thai
- 🇮🇳 Hindi
- 🇨🇿 Czech
- 🇪🇸 Spanish
- 🇯🇵 Japanese

## 🛠️ Development

### Available Scripts

```bash
# Frontend
npm run dev              # Start Next.js dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run type-check      # Run TypeScript checks
```

## 🔄 CI/CD

### Automatic Deployment
- **Frontend**: Auto-deploys to Netlify on push to main
- **Type Checking**: Runs automatically during build

## 🌍 Hosting Options

### Frontend Hosting
- ✅ Netlify (current)
- ✅ Vercel (compatible)
- ✅ GitHub Pages (compatible)

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