import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

class RedisConnection {
  private static instance: RedisConnection;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient({
      url: config.redis.url,
      password: config.redis.password,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    this.setupEventHandlers();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    this.client.on('end', () => {
      logger.info('Redis client connection ended');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis connected successfully', {
        service: config.server.serviceName,
        host: config.redis.host,
        port: config.redis.port,
      });
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Redis disconnected successfully', {
        service: config.server.serviceName,
      });
    } catch (error) {
      logger.error('Redis disconnection failed:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  // Cache operations
  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
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
        await this.client.setEx(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  public async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      logger.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  // Hash operations
  public async hGet(key: string, field: string): Promise<string | null> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Redis HGET error:', error);
      return null;
    }
  }

  public async hSet(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.client.hSet(key, field, value);
      return true;
    } catch (error) {
      logger.error('Redis HSET error:', error);
      return false;
    }
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Redis HGETALL error:', error);
      return {};
    }
  }

  public async hDel(key: string, field: string): Promise<boolean> {
    try {
      const result = await this.client.hDel(key, field);
      return result > 0;
    } catch (error) {
      logger.error('Redis HDEL error:', error);
      return false;
    }
  }

  // List operations
  public async lPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.lPush(key, values);
    } catch (error) {
      logger.error('Redis LPUSH error:', error);
      return 0;
    }
  }

  public async rPush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.client.rPush(key, values);
    } catch (error) {
      logger.error('Redis RPUSH error:', error);
      return 0;
    }
  }

  public async lPop(key: string): Promise<string | null> {
    try {
      return await this.client.lPop(key);
    } catch (error) {
      logger.error('Redis LPOP error:', error);
      return null;
    }
  }

  public async rPop(key: string): Promise<string | null> {
    try {
      return await this.client.rPop(key);
    } catch (error) {
      logger.error('Redis RPOP error:', error);
      return null;
    }
  }

  public async lRange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      return await this.client.lRange(key, start, stop);
    } catch (error) {
      logger.error('Redis LRANGE error:', error);
      return [];
    }
  }

  // Set operations
  public async sAdd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sAdd(key, members);
    } catch (error) {
      logger.error('Redis SADD error:', error);
      return 0;
    }
  }

  public async sRem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.client.sRem(key, members);
    } catch (error) {
      logger.error('Redis SREM error:', error);
      return 0;
    }
  }

  public async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      logger.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  public async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.client.sIsMember(key, member);
      return result;
    } catch (error) {
      logger.error('Redis SISMEMBER error:', error);
      return false;
    }
  }
}

export const redis = RedisConnection.getInstance();
export default redis;
