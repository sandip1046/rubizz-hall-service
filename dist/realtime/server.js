"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebSocketServer = startWebSocketServer;
const ws_1 = require("ws");
const eventBus_1 = require("./eventBus");
const logger_1 = require("@/utils/logger");
const config_1 = require("@/config/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function startWebSocketServer(httpServer) {
    if (!config_1.config.websocket.enabled) {
        logger_1.logger.info('WebSocket is disabled, skipping initialization');
        return null;
    }
    const wss = new ws_1.Server({
        server: httpServer,
        path: config_1.config.websocket.path,
        perMessageDeflate: false,
    });
    const rooms = new Map();
    const pingInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            const client = ws;
            if (!client.isAlive) {
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        });
    }, config_1.config.websocket.pingInterval);
    wss.on('connection', (ws, req) => {
        const client = ws;
        client.id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        client.isAlive = true;
        if (config_1.config.websocket.authentication) {
            const token = req.url?.split('token=')[1]?.split('&')[0] ||
                req.headers['authorization']?.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
                    client.userId = decoded.id || decoded.userId;
                    logger_1.logger.debug('WebSocket client authenticated', { clientId: client.id, userId: client.userId });
                }
                catch (error) {
                    logger_1.logger.warn('WebSocket authentication failed', { clientId: client.id });
                    client.close(1008, 'Authentication failed');
                    return;
                }
            }
            else {
                logger_1.logger.debug('WebSocket connection without authentication', { clientId: client.id });
            }
        }
        client.on('pong', () => {
            client.isAlive = true;
        });
        client.send(JSON.stringify({
            type: 'connected',
            payload: {
                clientId: client.id,
                timestamp: Date.now()
            }
        }));
        client.on('message', (message) => {
            try {
                const data = JSON.parse(message.toString());
                handleWebSocketMessage(client, data, rooms);
            }
            catch (error) {
                logger_1.logger.error('WebSocket message parse error', { error: error?.message, clientId: client.id });
                client.send(JSON.stringify({
                    type: 'error',
                    payload: { message: 'Invalid message format' }
                }));
            }
        });
        client.on('close', () => {
            rooms.forEach((clients, room) => {
                clients.delete(client);
                if (clients.size === 0) {
                    rooms.delete(room);
                }
            });
            logger_1.logger.debug('WebSocket client disconnected', { clientId: client.id });
        });
        client.on('error', (error) => {
            logger_1.logger.error('WebSocket client error', { error: error.message, clientId: client.id });
        });
        logger_1.logger.debug('WebSocket client connected', { clientId: client.id, userId: client.userId });
    });
    const handler = (event) => {
        const msg = JSON.stringify(event);
        if (event.room) {
            const roomClients = rooms.get(event.room);
            if (roomClients) {
                roomClients.forEach((client) => {
                    if (client.readyState === 1) {
                        client.send(msg);
                    }
                });
            }
        }
        else {
            wss.clients.forEach((client) => {
                if (client.readyState === 1) {
                    client.send(msg);
                }
            });
        }
    };
    eventBus_1.realtimeBus.on('event', handler);
    wss.on('close', () => {
        clearInterval(pingInterval);
        eventBus_1.realtimeBus.off('event', handler);
    });
    logger_1.logger.info('WebSocket server started', {
        path: config_1.config.websocket.path,
        authentication: config_1.config.websocket.authentication
    });
    return wss;
}
function handleWebSocketMessage(client, data, rooms) {
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
                    logger_1.logger.debug('Client joined room', { clientId: client.id, room: data.room });
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
                    logger_1.logger.debug('Client left room', { clientId: client.id, room: client.room });
                }
                break;
            case 'ping':
                client.send(JSON.stringify({ type: 'pong', payload: { timestamp: Date.now() } }));
                break;
            default:
                logger_1.logger.debug('Unknown WebSocket message type', { type: data.type, clientId: client.id });
        }
    }
    catch (error) {
        logger_1.logger.error('Error handling WebSocket message', { error: error?.message, clientId: client.id });
    }
}
//# sourceMappingURL=server.js.map