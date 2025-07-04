'use client';

import { useState, useEffect } from 'react';
import { useRealtimeConnection } from '@/lib/websocket-client';

export function ConnectionStatus() {
  const { isConnected, connectionError, client } = useRealtimeConnection();
  const [serverHealth, setServerHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [serverUrl, setServerUrl] = useState<string>('');

  useEffect(() => {
    // Get the server URL from environment
    const url = process.env.NEXT_PUBLIC_REALTIME_SERVER_URL || 'ws://localhost:3001';
    setServerUrl(url);

    // Check server health
    const checkServerHealth = async () => {
      try {
        const healthUrl = url.replace('ws://', 'http://').replace('wss://', 'https://') + '/health';
        const response = await fetch(healthUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          setServerHealth('healthy');
        } else {
          setServerHealth('unhealthy');
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setServerHealth('unhealthy');
      }
    };

    checkServerHealth();
    
    // Check health every 30 seconds
    const interval = setInterval(checkServerHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (serverHealth === 'checking') return 'bg-yellow-500';
    if (serverHealth === 'unhealthy') return 'bg-red-500';
    if (!isConnected) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (serverHealth === 'checking') return 'Checking server...';
    if (serverHealth === 'unhealthy') return 'Server unavailable';
    if (!isConnected) return 'Connecting...';
    return 'Connected';
  };

  const getStatusDescription = () => {
    if (serverHealth === 'unhealthy') {
      return `Cannot reach server at ${serverUrl}. Please check if the backend is running.`;
    }
    if (connectionError) {
      return connectionError;
    }
    if (isConnected) {
      return `Real-time features available via ${serverUrl}`;
    }
    return 'Attempting to establish real-time connection...';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">{getStatusText()}</span>
            {serverHealth === 'healthy' && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                Server Online
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{getStatusDescription()}</p>
        </div>
      </div>
      
      {serverHealth === 'unhealthy' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">
            <strong>Backend Server Required:</strong> Real-time features need the backend server running.
          </p>
          <div className="mt-2 text-xs text-red-700">
            <p>To start the server:</p>
            <code className="bg-red-100 px-1 rounded">cd server && npm run dev</code>
          </div>
        </div>
      )}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p><strong>Server URL:</strong> {serverUrl}</p>
            <p><strong>Socket ID:</strong> {client.socketId || 'Not connected'}</p>
            <p><strong>Health Status:</strong> {serverHealth}</p>
            <p><strong>WebSocket:</strong> {isConnected ? 'Connected' : 'Disconnected'}</p>
          </div>
        </details>
      )}
    </div>
  );
}