import Redis, { Redis as RedisType } from 'ioredis';
import { config } from '../config/config';
import { logger } from '../utils/logger';

class RedisConnection {
  private static instance: RedisConnection;
  private sessionClient: RedisType;
  private cacheClient: RedisType;
  private queueClient: RedisType;

  private constructor() {
    // Session Redis Client
    this.sessionClient = new Redis({
      host: config.redisSession.host,
      port: config.redisSession.port,
      ...(config.redisSession.password && { password: config.redisSession.password }),
      ...(config.redisSession.username && { username: config.redisSession.username }),
      ...(config.redisSession.tls && { tls: {} }),
      db: config.redisSession.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Cache Redis Client
    this.cacheClient = new Redis({
      host: config.redisCache.host,
      port: config.redisCache.port,
      ...(config.redisCache.password && { password: config.redisCache.password }),
      ...(config.redisCache.username && { username: config.redisCache.username }),
      ...(config.redisCache.tls && { tls: {} }),
      db: config.redisCache.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    // Queue Redis Client
    this.queueClient = new Redis({
      host: config.redisQueue.host,
      port: config.redisQueue.port,
      ...(config.redisQueue.password && { password: config.redisQueue.password }),
      ...(config.redisQueue.username && { username: config.redisQueue.username }),
      ...(config.redisQueue.tls && { tls: {} }),
      db: config.redisQueue.db,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public getSessionClient(): RedisType {
    return this.sessionClient;
  }

  public getCacheClient(): RedisType {
    return this.cacheClient;
  }

  public getQueueClient(): RedisType {
    return this.queueClient;
  }

  // Legacy method for backward compatibility
  public getClient(): RedisType {
    return this.sessionClient;
  }

  private setupEventHandlers(): void {
    // Session Client Event Handlers
    this.sessionClient.on('connect', () => {
      logger.info('Redis Session client connected');
    });

    this.sessionClient.on('ready', () => {
      logger.info('Redis Session client ready');
    });

    this.sessionClient.on('error', (error: Error) => {
      logger.error('Redis Session client error:', error);
    });

    this.sessionClient.on('end', () => {
      logger.info('Redis Session client connection ended');
    });

    this.sessionClient.on('reconnecting', () => {
      logger.info('Redis Session client reconnecting...');
    });

    // Cache Client Event Handlers
    this.cacheClient.on('connect', () => {
      logger.info('Redis Cache client connected');
    });

    this.cacheClient.on('ready', () => {
      logger.info('Redis Cache client ready');
    });

    this.cacheClient.on('error', (error: Error) => {
      logger.error('Redis Cache client error:', error);
    });

    this.cacheClient.on('end', () => {
      logger.info('Redis Cache client connection ended');
    });

    this.cacheClient.on('reconnecting', () => {
      logger.info('Redis Cache client reconnecting...');
    });

    // Queue Client Event Handlers
    this.queueClient.on('connect', () => {
      logger.info('Redis Queue client connected');
    });

    this.queueClient.on('ready', () => {
      logger.info('Redis Queue client ready');
    });

    this.queueClient.on('error', (error: Error) => {
      logger.error('Redis Queue client error:', error);
    });

    this.queueClient.on('end', () => {
      logger.info('Redis Queue client connection ended');
    });

    this.queueClient.on('reconnecting', () => {
      logger.info('Redis Queue client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    try {
      await Promise.all([
        this.sessionClient.connect(),
        this.cacheClient.connect(),
        this.queueClient.connect(),
      ]);
      logger.info('All Redis clients connected successfully', {
        service: config.server.serviceName,
        session: { host: config.redisSession.host, port: config.redisSession.port },
        cache: { host: config.redisCache.host, port: config.redisCache.port },
        queue: { host: config.redisQueue.host, port: config.redisQueue.port },
      });
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await Promise.all([
        this.sessionClient.disconnect(),
        this.cacheClient.disconnect(),
        this.queueClient.disconnect(),
      ]);
      logger.info('All Redis clients disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const [sessionResult, cacheResult, queueResult] = await Promise.all([
        this.sessionClient.ping(),
        this.cacheClient.ping(),
        this.queueClient.ping(),
      ]);
      return sessionResult === 'PONG' && cacheResult === 'PONG' && queueResult === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cache operations (using cache client)
  public async get(key: string): Promise<string | null> {
    try {
      return await this.cacheClient.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  public async set(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await this.cacheClient.setex(key, ttlSeconds, value);
      } else {
        await this.cacheClient.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const result = await this.cacheClient.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.cacheClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.cacheClient.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  // Hash operations (using session client for session data)
  public async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.sessionClient.hget(key, field);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      return null;
    }
  }

  public async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.sessionClient.hset(key, field, value);
      return true;
    } catch (error) {
      logger.error('Redis HSET error:', error);
      return false;
    }
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.sessionClient.hgetall(key);
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      return {};
    }
  }

  public async hDel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.sessionClient.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Redis HDEL error:', error);
      return false;
    }
  }

  // List operations (using queue client for message queues)
  public async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.queueClient.lpush(key, ...values);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  public async rPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.queueClient.rpush(key, ...values);
    } catch (error) {
      logger.error('Redis RPUSH error:', error);
      return 0;
    }
  }

  public async lPop(key: string): Promise<string | null> {
    try {
      return await this.queueClient.lpop(key);
    } catch (error) {
      logger.error('Redis LPOP error:', error);
      return null;
    }
  }

  public async rPop(key: string): Promise<string | null> {
    try {
      return await this.queueClient.rpop(key);
    } catch (error) {
      logger.error('Redis RPOP error:', error);
      return null;
    }
  }

  public async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.queueClient.lrange(key, start, stop);
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      return [];
    }
  }

  // Set operations (using cache client)
  public async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.cacheClient.sadd(key, ...members);
    } catch (error) {
      logger.error('Redis SADD error:', error);
      return 0;
    }
  }

  public async sRem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.cacheClient.srem(key, ...members);
    } catch (error) {
      logger.error('Redis SREM error:', error);
      return 0;
    }
  }

  public async sMembers(key: string): Promise<string[]> {
    try {
      return await this.cacheClient.smembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  public async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.cacheClient.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER error:', error);
      return false;
    }
  }
}

export const redis = RedisConnection.getInstance();
export default redis;
