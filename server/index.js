const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = createServer(app);

// Configure CORS for Netlify frontend
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://symphonious-tanuki-04d057.netlify.app',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store active connections
const connections = new Map();
const activeRooms = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: connections.size,
    rooms: activeRooms.size,
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Store connection info
  connections.set(socket.id, {
    socket,
    connectedAt: Date.now(),
    languages: new Set(),
    lastActivity: Date.now()
  });

  // Language room subscription
  socket.on('subscribe-language', (language) => {
    const connection = connections.get(socket.id);
    if (connection) {
      connection.languages.add(language);
      socket.join(`lang:${language}`);
      
      // Track active rooms
      if (!activeRooms.has(language)) {
        activeRooms.set(language, new Set());
      }
      activeRooms.get(language).add(socket.id);
      
      console.log(`${socket.id} subscribed to language: ${language}`);
      
      // Notify others in the room
      socket.to(`lang:${language}`).emit('user-joined', {
        userId: socket.id,
        language,
        timestamp: Date.now()
      });
    }
  });

  // Real-time audio streaming
  socket.on('stream-audio', (data) => {
    const { language, audioData, timestamp, metadata } = data;
    
    // Broadcast to all other clients in the language room
    socket.to(`lang:${language}`).emit('audio-stream', {
      audioData,
      timestamp,
      metadata,
      source: socket.id,
      receivedAt: Date.now()
    });
    
    // Update activity
    const connection = connections.get(socket.id);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  });

  // Translation request handling
  socket.on('translate-audio', async (data) => {
    try {
      const { audioData, sourceLanguage, targetLanguage, timestamp } = data;
      
      // Here you would integrate with OpenAI Realtime API
      // For now, we'll emit a placeholder response
      socket.emit('translation-result', {
        translatedText: '[Real-time translation - OpenAI integration needed]',
        sourceLanguage,
        targetLanguage,
        timestamp: Date.now(),
        originalTimestamp: timestamp
      });
      
    } catch (error) {
      console.error('Translation error:', error);
      socket.emit('translation-error', {
        error: 'Translation failed',
        timestamp: Date.now()
      });
    }
  });

  // Heartbeat handling
  socket.on('ping', () => {
    const connection = connections.get(socket.id);
    if (connection) {
      connection.lastActivity = Date.now();
      socket.emit('pong');
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    const connection = connections.get(socket.id);
    if (connection) {
      // Remove from language rooms
      connection.languages.forEach(language => {
        const room = activeRooms.get(language);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            activeRooms.delete(language);
          }
        }
        
        // Notify others in the room
        socket.to(`lang:${language}`).emit('user-left', {
          userId: socket.id,
          language,
          timestamp: Date.now()
        });
      });
    }
    
    connections.delete(socket.id);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Cleanup inactive connections
setInterval(() => {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  connections.forEach((connection, socketId) => {
    if (now - connection.lastActivity > timeout) {
      console.log(`Cleaning up inactive connection: ${socketId}`);
      connection.socket.disconnect();
      connections.delete(socketId);
    }
  });
}, 60000); // Check every minute

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Real-time server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});