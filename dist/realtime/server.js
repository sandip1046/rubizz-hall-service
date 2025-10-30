"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebSocketServer = startWebSocketServer;
const ws_1 = require("ws");
const eventBus_1 = require("./eventBus");
const logger_1 = require("@/utils/logger");
function startWebSocketServer(httpServer) {
    const wss = new ws_1.Server({ server: httpServer, path: '/ws' });
    wss.on('connection', (ws) => {
        ws.send(JSON.stringify({ type: 'connected', payload: { ts: Date.now() } }));
    });
    const handler = (event) => {
        const msg = JSON.stringify(event);
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(msg);
            }
        });
    };
    eventBus_1.realtimeBus.on('event', handler);
    wss.on('close', () => {
        eventBus_1.realtimeBus.off('event', handler);
    });
    logger_1.logger.info('WebSocket server started at /ws');
    return wss;
}
//# sourceMappingURL=server.js.map