// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow usage without type package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - allow usage without type package
import { Server } from 'ws';
import { realtimeBus } from './eventBus';
import { logger } from '@/utils/logger';

export function startWebSocketServer(httpServer: any): any {
  const wss = new Server({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: any) => {
    ws.send(JSON.stringify({ type: 'connected', payload: { ts: Date.now() } }));
  });

  const handler = (event: { type: string; payload: any }) => {
    const msg = JSON.stringify(event);
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        client.send(msg);
      }
    });
  };

  realtimeBus.on('event', handler);

  wss.on('close', () => {
    realtimeBus.off('event', handler);
  });

  logger.info('WebSocket server started at /ws');
  return wss;
}


