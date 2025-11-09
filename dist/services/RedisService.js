"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisService {
    constructor() {
        this.isConnected = false;
        this.baseUrl = config_1.config.redisService.url;
        this.timeout = config_1.config.redisService.timeout;
        this.retries = config_1.config.redisService.retries;
        this.retryDelay = config_1.config.redisService.retryDelay;
    }
    async connect() {
        try {
            const health = await this.healthCheck();
            this.isConnected = health.session && health.cache && health.queue;
            if (this.isConnected) {
                logger_1.logger.info('Connected to Redis service successfully');
            }
            else {
                throw new Error('Redis service health check failed');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Redis service:', { error: error?.message, stack: error?.stack });
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        this.isConnected = false;
        logger_1.logger.info('Disconnected from Redis service');
    }
    isServiceConnected() {
        return this.isConnected;
    }
    async setSession(sessionId, data, ttl = 3600) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'set',
                    key: `session:${sessionId}`,
                    value: JSON.stringify(data),
                    ttl
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to set session:', { error: error?.message });
            return false;
        }
    }
    async getSession(sessionId) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'get',
                    key: `session:${sessionId}`
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get session:', { error: error?.message });
            return null;
        }
    }
    async deleteSession(sessionId) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'del',
                    key: `session:${sessionId}`
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete session:', { error: error?.message });
            return false;
        }
    }
    async setCache(key, data, ttl = 3600) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'set',
                    key: `cache:${key}`,
                    value: JSON.stringify(data),
                    ttl
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to set cache:', { error: error?.message });
            return false;
        }
    }
    async getCache(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'get',
                    key: `cache:${key}`
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cache:', { error: error?.message });
            return null;
        }
    }
    async deleteCache(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'del',
                    key: `cache:${key}`
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete cache:', { error: error?.message });
            return false;
        }
    }
    async pushToQueue(queueName, data) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'lpush',
                    key: `queue:${queueName}`,
                    value: [JSON.stringify(data)]
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to push to queue:', { error: error?.message });
            return 0;
        }
    }
    async popFromQueue(queueName) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'rpop',
                    key: `queue:${queueName}`
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to pop from queue:', { error: error?.message });
            return null;
        }
    }
    async getQueueLength(queueName) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'llen',
                    key: `queue:${queueName}`
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to get queue length:', { error: error?.message });
            return 0;
        }
    }
    async hset(key, field, value) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'hset',
                    key,
                    field,
                    value: JSON.stringify(value)
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to hset:', { error: error?.message });
            return false;
        }
    }
    async hget(key, field) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'hget',
                    key,
                    field
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to hget:', { error: error?.message });
            return null;
        }
    }
    async hgetall(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'hgetall',
                    key
                }
            });
            if (response.success && response.data) {
                const parsed = {};
                for (const [field, value] of Object.entries(response.data)) {
                    parsed[field] = JSON.parse(value);
                }
                return parsed;
            }
            return {};
        }
        catch (error) {
            logger_1.logger.error('Failed to hgetall:', { error: error?.message });
            return {};
        }
    }
    async hdel(key, field) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'session',
                operation: {
                    operation: 'hdel',
                    key,
                    field
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to hdel:', { error: error?.message });
            return false;
        }
    }
    async lpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'lpush',
                    key,
                    value: values.map(value => JSON.stringify(value))
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to lpush:', { error: error?.message });
            return 0;
        }
    }
    async rpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'lpush',
                    key,
                    value: values.map(value => JSON.stringify(value))
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to rpush:', { error: error?.message });
            return 0;
        }
    }
    async lpop(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'rpop',
                    key
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to lpop:', { error: error?.message });
            return null;
        }
    }
    async rpop(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'rpop',
                    key
                }
            });
            if (response.success && response.data) {
                return JSON.parse(response.data);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to rpop:', { error: error?.message });
            return null;
        }
    }
    async lrange(key, start, stop) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'queue',
                operation: {
                    operation: 'llen',
                    key
                }
            });
            return [];
        }
        catch (error) {
            logger_1.logger.error('Failed to lrange:', { error: error?.message });
            return [];
        }
    }
    async sadd(key, ...members) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'sadd',
                    key,
                    members: members.map(member => JSON.stringify(member))
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to sadd:', { error: error?.message });
            return 0;
        }
    }
    async smembers(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'smembers',
                    key
                }
            });
            if (response.success && response.data) {
                return response.data.map((value) => JSON.parse(value));
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Failed to smembers:', { error: error?.message });
            return [];
        }
    }
    async srem(key, ...members) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'srem',
                    key,
                    members: members.map(member => JSON.stringify(member))
                }
            });
            return response.success ? (response.data || 0) : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to srem:', { error: error?.message });
            return 0;
        }
    }
    async sismember(key, member) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'sismember',
                    key,
                    member: JSON.stringify(member)
                }
            });
            return response.success ? (response.data || false) : false;
        }
        catch (error) {
            logger_1.logger.error('Failed to sismember:', { error: error?.message });
            return false;
        }
    }
    async exists(key) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'exists',
                    key
                }
            });
            return response.success ? (response.data || false) : false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check existence:', { error: error?.message });
            return false;
        }
    }
    async expire(key, ttl) {
        try {
            const response = await this.makeRequest('POST', '/execute', {
                instance: 'cache',
                operation: {
                    operation: 'expire',
                    key,
                    ttl
                }
            });
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to set expiration:', { error: error?.message });
            return false;
        }
    }
    async ttl(key) {
        try {
            return -1;
        }
        catch (error) {
            logger_1.logger.error('Failed to get TTL:', { error: error?.message });
            return -1;
        }
    }
    async healthCheck() {
        try {
            const response = await this.makeRequest('GET', '/health');
            if (response && response.redis) {
                return response.redis;
            }
            return { session: false, cache: false, queue: false };
        }
        catch (error) {
            logger_1.logger.error('Redis service health check failed:', { error: error?.message });
            return { session: false, cache: false, queue: false };
        }
    }
    async makeRequest(method, endpoint, data) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            method,
            url,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        if (method === 'POST' && data) {
            config.data = data;
        }
        else if (method === 'GET' && data) {
            config.params = data;
        }
        let lastError;
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                const response = await (0, axios_1.default)(config);
                return response.data;
            }
            catch (error) {
                lastError = error;
                if (attempt < this.retries) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
                else {
                    throw error;
                }
            }
        }
        throw lastError;
    }
}
exports.RedisService = RedisService;
exports.default = RedisService;
//# sourceMappingURL=RedisService.js.map