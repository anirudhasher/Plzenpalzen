import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';

export interface AudioStreamData {
  language: string;
  audioData: ArrayBuffer;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface TranslationRequest {
  audioData: ArrayBuffer;
  sourceLanguage: string;
  targetLanguage: string;
  timestamp: number;
}

export interface TranslationResult {
  originalData: TranslationRequest;
  translatedText: string;
  timestamp: number;
}

export class RealtimeAudioClient {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private subscribedLanguages = new Set<string>();

  // Event handlers
  private onConnectHandler?: () => void;
  private onDisconnectHandler?: (reason: string) => void;
  private onAudioStreamHandler?: (data: AudioStreamData & { source: string; receivedAt: number }) => void;
  private onTranslationResultHandler?: (result: TranslationResult) => void;
  private onErrorHandler?: (error: Error | unknown) => void;

  constructor(private serverUrl: string = 'ws://localhost:3001') {}

  public async connect(): Promise<boolean> {
    try {
      if (this.socket?.connected) {
        return true;
      }

      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Failed to create socket'));
          return;
        }

        const connectTimeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.socket.on('connect', () => {
          clearTimeout(connectTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('WebSocket connected');
          this.onConnectHandler?.();
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          clearTimeout(connectTimeout);
          this.isConnected = false;
          console.log('WebSocket disconnected:', reason);
          this.onDisconnectHandler?.(reason);
          
          // Auto-reconnect logic
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          clearTimeout(connectTimeout);
          console.error('WebSocket connection error:', error);
          this.onErrorHandler?.(error);
          reject(error);
        });

        this.socket.on('audio-stream', (data) => {
          this.onAudioStreamHandler?.(data);
        });

        this.socket.on('translation-result', (result) => {
          this.onTranslationResultHandler?.(result);
        });

        this.socket.on('translation-error', (error) => {
          this.onErrorHandler?.(error);
        });

        this.socket.on('pong', () => {
          // Heartbeat response
        });
      });
    } catch (error) {
      console.error('Connection error:', error);
      this.onErrorHandler?.(error);
      return false;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.subscribedLanguages.clear();
    }
  }

  public subscribeToLanguage(language: string): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    this.subscribedLanguages.add(language);
    this.socket.emit('subscribe-language', language);
  }

  public unsubscribeFromLanguage(language: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.subscribedLanguages.delete(language);
    this.socket.emit('unsubscribe-language', language);
  }

  public streamAudio(data: AudioStreamData): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    this.socket.emit('stream-audio', data);
  }

  public requestTranslation(request: TranslationRequest): void {
    if (!this.socket?.connected) {
      throw new Error('Not connected to WebSocket server');
    }

    this.socket.emit('translate-audio', request);
  }

  public sendHeartbeat(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      this.connect().catch(console.error);
    }, delay);
  }

  // Event handler setters
  public onConnect(handler: () => void): void {
    this.onConnectHandler = handler;
  }

  public onDisconnect(handler: (reason: string) => void): void {
    this.onDisconnectHandler = handler;
  }

  public onAudioStream(handler: (data: AudioStreamData & { source: string; receivedAt: number }) => void): void {
    this.onAudioStreamHandler = handler;
  }

  public onTranslationResult(handler: (result: TranslationResult) => void): void {
    this.onTranslationResultHandler = handler;
  }

  public onError(handler: (error: Error | unknown) => void): void {
    this.onErrorHandler = handler;
  }

  // Getters
  public get connected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  public get socketId(): string | undefined {
    return this.socket?.id;
  }

  public getSubscribedLanguages(): string[] {
    return Array.from(this.subscribedLanguages);
  }
}

// Singleton instance for the app
let clientInstance: RealtimeAudioClient | null = null;

export function getRealtimeClient(): RealtimeAudioClient {
  if (!clientInstance) {
    // Hybrid deployment: Frontend on Netlify, Backend self-hosted
    let serverUrl = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || 'ws://localhost:3001';
    
    // Only use IP configuration if no full URL is provided
    if (!process.env.NEXT_PUBLIC_REALTIME_SERVER_URL && process.env.NEXT_PUBLIC_REALTIME_SERVER_IP) {
      const ip = process.env.NEXT_PUBLIC_REALTIME_SERVER_IP;
      const port = process.env.NEXT_PUBLIC_REALTIME_SERVER_PORT || '3001';
      const protocol = process.env.NODE_ENV === 'development' ? 'ws' : 'wss';
      serverUrl = `${protocol}://${ip}:${port}`;
    }
    
    console.log('🔗 Connecting to real-time server:', serverUrl);
    clientInstance = new RealtimeAudioClient(serverUrl);
  }
  return clientInstance;
}

// Connection status hook for React components
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [client] = useState(() => getRealtimeClient());

  useEffect(() => {
    client.onConnect(() => {
      setIsConnected(true);
      setConnectionError(null);
    });

    client.onDisconnect((reason) => {
      setIsConnected(false);
      setConnectionError(`Disconnected: ${reason}`);
    });

    client.onError((error) => {
      setConnectionError(error instanceof Error ? error.message : 'Connection error');
    });

    // Auto-connect
    client.connect().catch(err => {
      setConnectionError(err.message || 'Failed to connect');
    });

    return () => {
      client.disconnect();
    };
  }, [client]);

  return {
    client,
    isConnected,
    connectionError,
    connect: () => client.connect(),
    disconnect: () => client.disconnect()
  };
}