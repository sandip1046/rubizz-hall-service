// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow usage without type package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow usage without type package
import { Server } from 'ws';
import { realtimeBus } from './eventBus';
import { logger } from '@/utils/logger';
import { config } from '@/config/config';
import jwt from 'jsonwebtoken';

// WebSocket client interface - ws library WebSocket instance with custom properties
interface WebSocketClient {
  id?: string;
  userId?: string;
  room?: string | null;
  isAlive?: boolean;
  // ws library methods (required - always present on ws WebSocket instances)
  terminate: () => void;
  ping: () => void;
  close: (code?: number, reason?: string) => void;
  send: (data: string) => void;
  on: (event: string, listener: (...args: any[]) => void) => void;
  readyState: number;
}

export function startWebSocketServer(httpServer: any): any {
  if (!config.websocket.enabled) {
    logger.info('WebSocket is disabled, skipping initialization');
    return null;
  }

  const wss = new Server({ 
    server: httpServer, 
    path: config.websocket.path,
    perMessageDeflate: false,
  });

  // Room management
  const rooms = new Map<string, Set<WebSocketClient>>();

  // Ping/pong for connection health
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      const client = ws as WebSocketClient;
      if (!client.isAlive) {
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, config.websocket.pingInterval);

  wss.on('connection', (ws: any, req: any) => {
    const client = ws as WebSocketClient;
    client.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    client.isAlive = true;

    // Authentication (if enabled)
    if (config.websocket.authentication) {
      const token = req.url?.split('token=')[1]?.split('&')[0] || 
                    req.headers['authorization']?.replace('Bearer ', '');
      
      if (token) {
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as any;
          client.userId = decoded.id || decoded.userId;
          logger.debug('WebSocket client authenticated', { clientId: client.id, userId: client.userId });
        } catch (error) {
          logger.warn('WebSocket authentication failed', { clientId: client.id });
          client.close(1008, 'Authentication failed');
          return;
        }
      } else {
        logger.debug('WebSocket connection without authentication', { clientId: client.id });
      }
    }

    // Handle pong
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Send connection confirmation
    client.send(JSON.stringify({ 
      type: 'connected', 
      payload: { 
        clientId: client.id,
        timestamp: Date.now() 
      } 
    }));

    // Handle messages
    client.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(client, data, rooms);
      } catch (error: any) {
        logger.error('WebSocket message parse error', { error: error?.message, clientId: client.id });
        client.send(JSON.stringify({ 
          type: 'error', 
          payload: { message: 'Invalid message format' } 
        }));
      }
    });

    // Handle close
    client.on('close', () => {
      // Remove from rooms
      rooms.forEach((clients, room) => {
        clients.delete(client);
        if (clients.size === 0) {
          rooms.delete(room);
        }
      });
      logger.debug('WebSocket client disconnected', { clientId: client.id });
    });

    // Handle errors
    client.on('error', (error: Error) => {
      logger.error('WebSocket client error', { error: error.message, clientId: client.id });
    });

    logger.debug('WebSocket client connected', { clientId: client.id, userId: client.userId });
  });

  // Event bus handler for broadcasting
  const handler = (event: { type: string; payload: any; room?: string }) => {
    const msg = JSON.stringify(event);
    
    if (event.room) {
      // Broadcast to specific room
      const roomClients = rooms.get(event.room);
      if (roomClients) {
        roomClients.forEach((client: WebSocketClient) => {
          if (client.readyState === 1) {
            client.send(msg);
          }
        });
      }
    } else {
      // Broadcast to all clients
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(msg);
        }
      });
    }
  };

  realtimeBus.on('event', handler);

  // Cleanup on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
    realtimeBus.off('event', handler);
  });

  logger.info('WebSocket server started', { 
    path: config.websocket.path,
    authentication: config.websocket.authentication 
  });
  
  return wss;
}

function handleWebSocketMessage(client: WebSocketClient, data: any, rooms: Map<string, Set<WebSocketClient>>): void {
  try {
    switch (data.type) {
      case 'join':
        if (data.room) {
          if (!rooms.has(data.room)) {
            rooms.set(data.room, new Set());
          }
          rooms.get(data.room)?.add(client);
          client.room = data.room;
          client.send(JSON.stringify({ 
            type: 'joined', 
            payload: { room: data.room } 
          }));
          logger.debug('Client joined room', { clientId: client.id, room: data.room });
        }
        break;
      
      case 'leave':
        if (client.room) {
          const roomClients = rooms.get(client.room);
          roomClients?.delete(client);
          if (roomClients && roomClients.size === 0) {
            rooms.delete(client.room);
          }
          client.send(JSON.stringify({ 
            type: 'left', 
            payload: { room: client.room } 
          }));
          client.room = null;
          logger.debug('Client left room', { clientId: client.id, room: client.room });
        }
        break;
      
      case 'ping':
        client.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
        break;
      
      default:
        logger.debug('Unknown WebSocket message type', { type: data.type, clientId: client.id });
    }
  } catch (error: any) {
    logger.error('Error handling WebSocket message', { error: error?.message, clientId: client.id });
  }
}


