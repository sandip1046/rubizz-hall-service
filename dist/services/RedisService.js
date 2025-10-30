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
            return await this.setCache(`session:${sessionId}`, data, ttl);
        }
        catch (error) {
            logger_1.logger.error('Failed to set session:', { error: error?.message });
            return false;
        }
    }
    async getSession(sessionId) {
        try {
            return await this.getCache(`session:${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to get session:', { error: error?.message });
            return null;
        }
    }
    async deleteSession(sessionId) {
        try {
            return await this.deleteCache(`session:${sessionId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete session:', { error: error?.message });
            return false;
        }
    }
    async setCache(key, data, ttl = 3600) {
        try {
            const response = await this.makeRequest('POST', '/cache', {
                key: `cache:${key}`,
                value: JSON.stringify(data),
                ttl
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
            const response = await this.makeRequest('GET', `/cache/${encodeURIComponent(`cache:${key}`)}`);
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
            const response = await this.makeRequest('DELETE', `/cache/${encodeURIComponent(`cache:${key}`)}`);
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete cache:', { error: error?.message });
            return false;
        }
    }
    async pushToQueue(queueName, data) {
        try {
            const response = await this.makeRequest('POST', '/queue', {
                queue: `queue:${queueName}`,
                value: JSON.stringify(data)
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to push to queue:', { error: error?.message });
            return 0;
        }
    }
    async popFromQueue(queueName) {
        try {
            const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}`);
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
            const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}/length`);
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to get queue length:', { error: error?.message });
            return 0;
        }
    }
    async hset(key, field, value) {
        try {
            const response = await this.makeRequest('POST', '/hash', {
                key,
                field,
                value: JSON.stringify(value)
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
            const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
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
            const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}`);
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
            const response = await this.makeRequest('DELETE', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
            return response.success;
        }
        catch (error) {
            logger_1.logger.error('Failed to hdel:', { error: error?.message });
            return false;
        }
    }
    async lpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/list/lpush', {
                key,
                values: values.map(value => JSON.stringify(value))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to lpush:', { error: error?.message });
            return 0;
        }
    }
    async rpush(key, ...values) {
        try {
            const response = await this.makeRequest('POST', '/list/rpush', {
                key,
                values: values.map(value => JSON.stringify(value))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to rpush:', { error: error?.message });
            return 0;
        }
    }
    async lpop(key) {
        try {
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/lpop`);
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
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/rpop`);
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
            const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/range?start=${start}&stop=${stop}`);
            if (response.success && response.data) {
                return response.data.map((value) => JSON.parse(value));
            }
            return [];
        }
        catch (error) {
            logger_1.logger.error('Failed to lrange:', { error: error?.message });
            return [];
        }
    }
    async sadd(key, ...members) {
        try {
            const response = await this.makeRequest('POST', '/set', {
                key,
                members: members.map(member => JSON.stringify(member))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to sadd:', { error: error?.message });
            return 0;
        }
    }
    async smembers(key) {
        try {
            const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}`);
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
            const response = await this.makeRequest('DELETE', '/set', {
                key,
                members: members.map(member => JSON.stringify(member))
            });
            return response.success ? response.data : 0;
        }
        catch (error) {
            logger_1.logger.error('Failed to srem:', { error: error?.message });
            return 0;
        }
    }
    async sismember(key, member) {
        try {
            const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}/ismember?member=${encodeURIComponent(JSON.stringify(member))}`);
            return response.success ? response.data : false;
        }
        catch (error) {
            logger_1.logger.error('Failed to sismember:', { error: error?.message });
            return false;
        }
    }
    async exists(key) {
        try {
            const response = await this.makeRequest('GET', `/exists/${encodeURIComponent(key)}`);
            return response.success ? response.data : false;
        }
        catch (error) {
            logger_1.logger.error('Failed to check existence:', { error: error?.message });
            return false;
        }
    }
    async expire(key, ttl) {
        try {
            const response = await this.makeRequest('POST', '/expire', {
                key,
                ttl
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
            const response = await this.makeRequest('GET', `/ttl/${encodeURIComponent(key)}`);
            return response.success ? response.data : -1;
        }
        catch (error) {
            logger_1.logger.error('Failed to get TTL:', { error: error?.message });
            return -1;
        }
    }
    async healthCheck() {
        try {
            const response = await this.makeRequest('GET', '/health');
            if (response.success && response.data) {
                return response.data.redis || { session: false, cache: false, queue: false };
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
            data,
            headers: {
                'Content-Type': 'application/json',
            },
        };
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
            }
        }
        throw lastError;
    }
}
exports.RedisService = RedisService;
exports.default = RedisService;
//# sourceMappingURL=RedisService.js.map