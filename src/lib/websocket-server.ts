import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';

interface ConnectionData {
  socket: Socket;
  languages: Set<string>;
  connected: boolean;
  lastActivity: number;
}

// WebSocket server for real-time audio communication
export class RealtimeAudioServer {
  private io: SocketIOServer;
  private server: HttpServer;
  private connections = new Map<string, ConnectionData>();

  constructor() {
    this.server = createServer();
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'development' ? "http://localhost:3000" : process.env.NEXT_PUBLIC_URL,
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Store connection
      this.connections.set(socket.id, {
        socket,
        languages: new Set(),
        connected: true,
        lastActivity: Date.now()
      });

      // Handle language subscription
      socket.on('subscribe-language', (language: string) => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          connection.languages.add(language);
          socket.join(`language:${language}`);
          console.log(`Client ${socket.id} subscribed to language: ${language}`);
        }
      });

      // Handle audio streaming
      socket.on('stream-audio', (data: { 
        language: string; 
        audioData: ArrayBuffer; 
        timestamp: number;
        metadata?: Record<string, unknown>;
      }) => {
        // Broadcast to all clients listening to this language
        socket.to(`language:${data.language}`).emit('audio-stream', {
          ...data,
          source: socket.id,
          receivedAt: Date.now()
        });
      });

      // Handle translation requests
      socket.on('translate-audio', (data: {
        audioData: ArrayBuffer;
        sourceLanguage: string;
        targetLanguage: string;
        timestamp: number;
      }) => {
        this.handleTranslationRequest(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`Client ${socket.id} disconnected: ${reason}`);
        this.connections.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });

      // Heartbeat for connection health
      socket.on('ping', () => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          connection.lastActivity = Date.now();
          socket.emit('pong');
        }
      });
    });
  }

  private async handleTranslationRequest(socket: Socket, data: {
    audioData: ArrayBuffer;
    sourceLanguage: string;
    targetLanguage: string;
    timestamp: number;
  }) {
    try {
      // This will be implemented when we add OpenAI Realtime API integration
      console.log('Translation request received:', {
        source: data.sourceLanguage,
        target: data.targetLanguage,
        timestamp: data.timestamp
      });
      
      // For now, emit back a placeholder response
      socket.emit('translation-result', {
        originalData: data,
        translatedText: '[Translation pending - Realtime API integration needed]',
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Translation error:', error);
      socket.emit('translation-error', {
        error: 'Translation failed',
        timestamp: Date.now()
      });
    }
  }

  public listen(port: number = 3001) {
    this.server.listen(port, () => {
      console.log(`WebSocket server running on port ${port}`);
    });
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getActiveLanguages(): string[] {
    const languages = new Set<string>();
    this.connections.forEach(conn => {
      conn.languages.forEach((lang: string) => languages.add(lang));
    });
    return Array.from(languages);
  }
}

// Singleton instance
let serverInstance: RealtimeAudioServer | null = null;

export function getRealtimeServer(): RealtimeAudioServer {
  if (!serverInstance) {
    serverInstance = new RealtimeAudioServer();
  }
  return serverInstance;
}

// Next.js API route handler for WebSocket upgrade
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ 
      message: 'WebSocket server is running',
      connections: getRealtimeServer().getConnectionCount(),
      activeLanguages: getRealtimeServer().getActiveLanguages()
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}