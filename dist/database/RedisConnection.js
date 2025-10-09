"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class RedisConnection {
    constructor() {
        this.sessionClient = new ioredis_1.default({
            host: config_1.config.redisSession.host,
            port: config_1.config.redisSession.port,
            ...(config_1.config.redisSession.password && { password: config_1.config.redisSession.password }),
            ...(config_1.config.redisSession.username && { username: config_1.config.redisSession.username }),
            ...(config_1.config.redisSession.tls && { tls: {} }),
            db: config_1.config.redisSession.db,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.cacheClient = new ioredis_1.default({
            host: config_1.config.redisCache.host,
            port: config_1.config.redisCache.port,
            ...(config_1.config.redisCache.password && { password: config_1.config.redisCache.password }),
            ...(config_1.config.redisCache.username && { username: config_1.config.redisCache.username }),
            ...(config_1.config.redisCache.tls && { tls: {} }),
            db: config_1.config.redisCache.db,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.queueClient = new ioredis_1.default({
            host: config_1.config.redisQueue.host,
            port: config_1.config.redisQueue.port,
            ...(config_1.config.redisQueue.password && { password: config_1.config.redisQueue.password }),
            ...(config_1.config.redisQueue.username && { username: config_1.config.redisQueue.username }),
            ...(config_1.config.redisQueue.tls && { tls: {} }),
            db: config_1.config.redisQueue.db,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        });
        this.setupEventHandlers();
    }
    static getInstance() {
        if (!RedisConnection.instance) {
            RedisConnection.instance = new RedisConnection();
        }
        return RedisConnection.instance;
    }
    getSessionClient() {
        return this.sessionClient;
    }
    getCacheClient() {
        return this.cacheClient;
    }
    getQueueClient() {
        return this.queueClient;
    }
    getClient() {
        return this.sessionClient;
    }
    setupEventHandlers() {
        this.sessionClient.on('connect', () => {
            logger_1.logger.info('Redis Session client connected');
        });
        this.sessionClient.on('ready', () => {
            logger_1.logger.info('Redis Session client ready');
        });
        this.sessionClient.on('error', (error) => {
            logger_1.logger.error('Redis Session client error:', error);
        });
        this.sessionClient.on('end', () => {
            logger_1.logger.info('Redis Session client connection ended');
        });
        this.sessionClient.on('reconnecting', () => {
            logger_1.logger.info('Redis Session client reconnecting...');
        });
        this.cacheClient.on('connect', () => {
            logger_1.logger.info('Redis Cache client connected');
        });
        this.cacheClient.on('ready', () => {
            logger_1.logger.info('Redis Cache client ready');
        });
        this.cacheClient.on('error', (error) => {
            logger_1.logger.error('Redis Cache client error:', error);
        });
        this.cacheClient.on('end', () => {
            logger_1.logger.info('Redis Cache client connection ended');
        });
        this.cacheClient.on('reconnecting', () => {
            logger_1.logger.info('Redis Cache client reconnecting...');
        });
        this.queueClient.on('connect', () => {
            logger_1.logger.info('Redis Queue client connected');
        });
        this.queueClient.on('ready', () => {
            logger_1.logger.info('Redis Queue client ready');
        });
        this.queueClient.on('error', (error) => {
            logger_1.logger.error('Redis Queue client error:', error);
        });
        this.queueClient.on('end', () => {
            logger_1.logger.info('Redis Queue client connection ended');
        });
        this.queueClient.on('reconnecting', () => {
            logger_1.logger.info('Redis Queue client reconnecting...');
        });
    }
    async connect() {
        try {
            await Promise.all([
                this.sessionClient.connect(),
                this.cacheClient.connect(),
                this.queueClient.connect(),
            ]);
            logger_1.logger.info('All Redis clients connected successfully', {
                service: config_1.config.server.serviceName,
                session: { host: config_1.config.redisSession.host, port: config_1.config.redisSession.port },
                cache: { host: config_1.config.redisCache.host, port: config_1.config.redisCache.port },
                queue: { host: config_1.config.redisQueue.host, port: config_1.config.redisQueue.port },
            });
        }
        catch (error) {
            logger_1.logger.error('Redis connection failed:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            await Promise.all([
                this.sessionClient.disconnect(),
                this.cacheClient.disconnect(),
                this.queueClient.disconnect(),
            ]);
            logger_1.logger.info('All Redis clients disconnected successfully', {
                service: config_1.config.server.serviceName,
            });
        }
        catch (error) {
            logger_1.logger.error('Redis disconnection failed:', error);
            throw error;
        }
    }
    async healthCheck() {
        try {
            const [sessionResult, cacheResult, queueResult] = await Promise.all([
                this.sessionClient.ping(),
                this.cacheClient.ping(),
                this.queueClient.ping(),
            ]);
            return sessionResult === 'PONG' && cacheResult === 'PONG' && queueResult === 'PONG';
        }
        catch (error) {
            logger_1.logger.error('Redis health check failed:', error);
            return false;
        }
    }
    async get(key) {
        try {
            return await this.cacheClient.get(key);
        }
        catch (error) {
            logger_1.logger.error('Redis GET error:', error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.cacheClient.setex(key, ttlSeconds, value);
            }
            else {
                await this.cacheClient.set(key, value);
            }
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis SET error:', error);
            return false;
        }
    }
    async del(key) {
        try {
            const result = await this.cacheClient.del(key);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Redis DEL error:', error);
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await this.cacheClient.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS error:', error);
            return false;
        }
    }
    async expire(key, ttlSeconds) {
        try {
            const result = await this.cacheClient.expire(key, ttlSeconds);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXPIRE error:', error);
            return false;
        }
    }
    async hGet(key, field) {
        try {
            return await this.sessionClient.hget(key, field);
        }
        catch (error) {
            logger_1.logger.error('Redis HGET error:', error);
            return null;
        }
    }
    async hSet(key, field, value) {
        try {
            await this.sessionClient.hset(key, field, value);
            return true;
        }
        catch (error) {
            logger_1.logger.error('Redis HSET error:', error);
            return false;
        }
    }
    async hGetAll(key) {
        try {
            return await this.sessionClient.hgetall(key);
        }
        catch (error) {
            logger_1.logger.error('Redis HGETALL error:', error);
            return {};
        }
    }
    async hDel(key, field) {
        try {
            const result = await this.sessionClient.hdel(key, field);
            return result > 0;
        }
        catch (error) {
            logger_1.logger.error('Redis HDEL error:', error);
            return false;
        }
    }
    async lPush(key, ...values) {
        try {
            return await this.queueClient.lpush(key, ...values);
        }
        catch (error) {
            logger_1.logger.error('Redis LPUSH error:', error);
            return 0;
        }
    }
    async rPush(key, ...values) {
        try {
            return await this.queueClient.rpush(key, ...values);
        }
        catch (error) {
            logger_1.logger.error('Redis RPUSH error:', error);
            return 0;
        }
    }
    async lPop(key) {
        try {
            return await this.queueClient.lpop(key);
        }
        catch (error) {
            logger_1.logger.error('Redis LPOP error:', error);
            return null;
        }
    }
    async rPop(key) {
        try {
            return await this.queueClient.rpop(key);
        }
        catch (error) {
            logger_1.logger.error('Redis RPOP error:', error);
            return null;
        }
    }
    async lRange(key, start, stop) {
        try {
            return await this.queueClient.lrange(key, start, stop);
        }
        catch (error) {
            logger_1.logger.error('Redis LRANGE error:', error);
            return [];
        }
    }
    async sAdd(key, ...members) {
        try {
            return await this.cacheClient.sadd(key, ...members);
        }
        catch (error) {
            logger_1.logger.error('Redis SADD error:', error);
            return 0;
        }
    }
    async sRem(key, ...members) {
        try {
            return await this.cacheClient.srem(key, ...members);
        }
        catch (error) {
            logger_1.logger.error('Redis SREM error:', error);
            return 0;
        }
    }
    async sMembers(key) {
        try {
            return await this.cacheClient.smembers(key);
        }
        catch (error) {
            logger_1.logger.error('Redis SMEMBERS error:', error);
            return [];
        }
    }
    async sIsMember(key, member) {
        try {
            const result = await this.cacheClient.sismember(key, member);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis SISMEMBER error:', error);
            return false;
        }
    }
}
exports.redis = RedisConnection.getInstance();
exports.default = exports.redis;
//# sourceMappingURL=RedisConnection.js.map