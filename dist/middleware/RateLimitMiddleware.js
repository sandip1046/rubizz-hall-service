"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const RedisConnection_1 = require("@/database/RedisConnection");
const logger_1 = require("@/utils/logger");
const config_1 = require("@/config/config");
class RedisStore {
    constructor(prefix = 'rate_limit:') {
        this.prefix = prefix;
    }
    getKey(key) {
        return `${this.prefix}${key}`;
    }
    async increment(key, windowMs) {
        const redisKey = this.getKey(key);
        const now = Date.now();
        const window = Math.floor(now / windowMs);
        const windowKey = `${redisKey}:${window}`;
        const totalHits = await RedisConnection_1.redis.getCacheClient().incr(windowKey);
        if (totalHits === 1) {
            await RedisConnection_1.redis.getCacheClient().expire(windowKey, Math.ceil(windowMs / 1000));
        }
        const resetTime = new Date((window + 1) * windowMs);
        return { totalHits, resetTime };
    }
    async decrement(key) {
        const redisKey = this.getKey(key);
        const now = Date.now();
        const window = Math.floor(now / config_1.config.rateLimit.windowMs);
        const windowKey = `${redisKey}:${window}`;
        await RedisConnection_1.redis.getCacheClient().decr(windowKey);
    }
    async resetKey(key) {
        const redisKey = this.getKey(key);
        const pattern = `${redisKey}:*`;
        const keys = await RedisConnection_1.redis.getCacheClient().keys(pattern);
        if (keys.length > 0) {
            await RedisConnection_1.redis.getCacheClient().del(keys);
        }
    }
}
const store = new RedisStore();
class RateLimitMiddleware {
    static create(options) {
        return (0, express_rate_limit_1.default)({
            windowMs: options.windowMs,
            max: options.max,
            message: options.message || {
                success: false,
                message: 'Rate limit exceeded',
                timestamp: new Date().toISOString(),
            },
            standardHeaders: true,
            legacyHeaders: false,
            store: {
                increment: async (key) => {
                    try {
                        return await store.increment(key, options.windowMs);
                    }
                    catch (error) {
                        logger_1.logger.error('Custom rate limit store error:', error);
                        return { totalHits: 1, resetTime: new Date(Date.now() + options.windowMs) };
                    }
                },
                decrement: async (key) => {
                    try {
                        await store.decrement(key);
                    }
                    catch (error) {
                        logger_1.logger.error('Custom rate limit decrement error:', error);
                    }
                },
                resetKey: async (key) => {
                    try {
                        await store.resetKey(key);
                    }
                    catch (error) {
                        logger_1.logger.error('Custom rate limit reset error:', error);
                    }
                },
            },
            keyGenerator: options.keyGenerator || ((req) => {
                const userId = req.user?.id;
                const ip = req.ip || req.connection.remoteAddress || 'unknown';
                return userId ? `custom:user:${userId}` : `custom:ip:${ip}`;
            }),
            ...(options.skip && { skip: options.skip }),
        });
    }
    static async resetRateLimit(key) {
        try {
            await store.resetKey(key);
            logger_1.logger.info('Rate limit reset', { key });
        }
        catch (error) {
            logger_1.logger.error('Failed to reset rate limit:', error);
        }
    }
    static async getRateLimitStatus(key) {
        try {
            const result = await store.increment(key, config_1.config.rateLimit.windowMs);
            return {
                totalHits: result.totalHits,
                resetTime: result.resetTime,
                remaining: Math.max(0, config_1.config.rateLimit.maxRequests - result.totalHits),
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get rate limit status:', error);
            return null;
        }
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
_a = RateLimitMiddleware;
RateLimitMiddleware.general = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.rateLimit.windowMs,
    max: config_1.config.rateLimit.maxRequests,
    message: {
        success: false,
        message: 'Too many requests, please try again later',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
        increment: async (key) => {
            try {
                return await store.increment(key, config_1.config.rateLimit.windowMs);
            }
            catch (error) {
                logger_1.logger.error('Rate limit store error:', error);
                return { totalHits: 1, resetTime: new Date(Date.now() + config_1.config.rateLimit.windowMs) };
            }
        },
        decrement: async (key) => {
            try {
                await store.decrement(key);
            }
            catch (error) {
                logger_1.logger.error('Rate limit decrement error:', error);
            }
        },
        resetKey: async (key) => {
            try {
                await store.resetKey(key);
            }
            catch (error) {
                logger_1.logger.error('Rate limit reset error:', error);
            }
        },
    },
    keyGenerator: (req) => {
        const userId = req.user?.id;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return userId ? `user:${userId}` : `ip:${ip}`;
    },
    skip: (req) => {
        return req.path === '/health' || req.path === '/health/ready';
    },
});
RateLimitMiddleware.strict = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many requests for this operation, please try again later',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
        increment: async (key) => {
            try {
                return await store.increment(key, 15 * 60 * 1000);
            }
            catch (error) {
                logger_1.logger.error('Strict rate limit store error:', error);
                return { totalHits: 1, resetTime: new Date(Date.now() + 15 * 60 * 1000) };
            }
        },
        decrement: async (key) => {
            try {
                await store.decrement(key);
            }
            catch (error) {
                logger_1.logger.error('Strict rate limit decrement error:', error);
            }
        },
        resetKey: async (key) => {
            try {
                await store.resetKey(key);
            }
            catch (error) {
                logger_1.logger.error('Strict rate limit reset error:', error);
            }
        },
    },
    keyGenerator: (req) => {
        const userId = req.user?.id;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const operation = req.path.split('/').pop();
        return userId ? `strict:user:${userId}:${operation}` : `strict:ip:${ip}:${operation}`;
    },
});
RateLimitMiddleware.auth = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again later',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
        increment: async (key) => {
            try {
                return await store.increment(key, 15 * 60 * 1000);
            }
            catch (error) {
                logger_1.logger.error('Auth rate limit store error:', error);
                return { totalHits: 1, resetTime: new Date(Date.now() + 15 * 60 * 1000) };
            }
        },
        decrement: async (key) => {
            try {
                await store.decrement(key);
            }
            catch (error) {
                logger_1.logger.error('Auth rate limit decrement error:', error);
            }
        },
        resetKey: async (key) => {
            try {
                await store.resetKey(key);
            }
            catch (error) {
                logger_1.logger.error('Auth rate limit reset error:', error);
            }
        },
    },
    keyGenerator: (req) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `auth:${ip}`;
    },
    skip: (req) => {
        return !!req.user;
    },
});
RateLimitMiddleware.apiKey = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'API rate limit exceeded, please try again later',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
        increment: async (key) => {
            try {
                return await store.increment(key, 60 * 1000);
            }
            catch (error) {
                logger_1.logger.error('API key rate limit store error:', error);
                return { totalHits: 1, resetTime: new Date(Date.now() + 60 * 1000) };
            }
        },
        decrement: async (key) => {
            try {
                await store.decrement(key);
            }
            catch (error) {
                logger_1.logger.error('API key rate limit decrement error:', error);
            }
        },
        resetKey: async (key) => {
            try {
                await store.resetKey(key);
            }
            catch (error) {
                logger_1.logger.error('API key rate limit reset error:', error);
            }
        },
    },
    keyGenerator: (req) => {
        const apiKey = req.headers['x-api-key'];
        return `api:${apiKey || 'anonymous'}`;
    },
});
RateLimitMiddleware.fileUpload = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'File upload limit exceeded, please try again later',
        timestamp: new Date().toISOString(),
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: {
        increment: async (key) => {
            try {
                return await store.increment(key, 60 * 60 * 1000);
            }
            catch (error) {
                logger_1.logger.error('File upload rate limit store error:', error);
                return { totalHits: 1, resetTime: new Date(Date.now() + 60 * 60 * 1000) };
            }
        },
        decrement: async (key) => {
            try {
                await store.decrement(key);
            }
            catch (error) {
                logger_1.logger.error('File upload rate limit decrement error:', error);
            }
        },
        resetKey: async (key) => {
            try {
                await store.resetKey(key);
            }
            catch (error) {
                logger_1.logger.error('File upload rate limit reset error:', error);
            }
        },
    },
    keyGenerator: (req) => {
        const userId = req.user?.id;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return userId ? `upload:user:${userId}` : `upload:ip:${ip}`;
    },
});
exports.default = RateLimitMiddleware;
//# sourceMappingURL=RateLimitMiddleware.js.map