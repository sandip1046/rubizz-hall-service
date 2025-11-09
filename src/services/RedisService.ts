import axios from 'axios';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class RedisService {
  private baseUrl: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private isConnected: boolean = false;

  constructor() {
    this.baseUrl = config.redisService.url;
    this.timeout = config.redisService.timeout;
    this.retries = config.redisService.retries;
    this.retryDelay = config.redisService.retryDelay;
  }

  public async connect(): Promise<void> {
    try {
      const health = await this.healthCheck();
      this.isConnected = health.session && health.cache && health.queue;
      
      if (this.isConnected) {
        logger.info('Connected to Redis service successfully');
      } else {
        throw new Error('Redis service health check failed');
      }
    } catch (error) {
      logger.error('Failed to connect to Redis service:', { error: (error as any)?.message, stack: (error as any)?.stack });
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('Disconnected from Redis service');
  }

  public isServiceConnected(): boolean {
    return this.isConnected;
  }

  // Session operations
  public async setSession(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to set session:', { error: (error as any)?.message });
      return false;
    }
  }

  public async getSession(sessionId: string): Promise<any | null> {
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
    } catch (error) {
      logger.error('Failed to get session:', { error: (error as any)?.message });
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'session',
        operation: {
          operation: 'del',
          key: `session:${sessionId}`
        }
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to delete session:', { error: (error as any)?.message });
      return false;
    }
  }

  // Cache operations
  public async setCache(key: string, data: any, ttl: number = 3600): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to set cache:', { error: (error as any)?.message });
      return false;
    }
  }

  public async getCache(key: string): Promise<any | null> {
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
    } catch (error) {
      logger.error('Failed to get cache:', { error: (error as any)?.message });
      return null;
    }
  }

  public async deleteCache(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'cache',
        operation: {
          operation: 'del',
          key: `cache:${key}`
        }
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to delete cache:', { error: (error as any)?.message });
      return false;
    }
  }

  // Queue operations
  public async pushToQueue(queueName: string, data: any): Promise<number> {
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
    } catch (error) {
      logger.error('Failed to push to queue:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async popFromQueue(queueName: string): Promise<any | null> {
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
    } catch (error) {
      logger.error('Failed to pop from queue:', { error: (error as any)?.message });
      return null;
    }
  }

  public async getQueueLength(queueName: string): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'queue',
        operation: {
          operation: 'llen',
          key: `queue:${queueName}`
        }
      });
      return response.success ? (response.data || 0) : 0;
    } catch (error) {
      logger.error('Failed to get queue length:', { error: (error as any)?.message });
      return 0;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: any): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to hset:', { error: (error as any)?.message });
      return false;
    }
  }

  public async hget(key: string, field: string): Promise<any | null> {
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
    } catch (error) {
      logger.error('Failed to hget:', { error: (error as any)?.message });
      return null;
    }
  }

  public async hgetall(key: string): Promise<Record<string, any>> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'session',
        operation: {
          operation: 'hgetall',
          key
        }
      });
      if (response.success && response.data) {
        const parsed: Record<string, any> = {};
        for (const [field, value] of Object.entries(response.data)) {
          parsed[field] = JSON.parse(value as string);
        }
        return parsed;
      }
      return {};
    } catch (error) {
      logger.error('Failed to hgetall:', { error: (error as any)?.message });
      return {};
    }
  }

  public async hdel(key: string, field: string): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to hdel:', { error: (error as any)?.message });
      return false;
    }
  }

  // List operations
  public async lpush(key: string, ...values: any[]): Promise<number> {
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
    } catch (error) {
      logger.error('Failed to lpush:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'queue',
        operation: {
          operation: 'lpush', // Note: Redis service may need rpush support, using lpush for now
          key,
          value: values.map(value => JSON.stringify(value))
        }
      });
      return response.success ? (response.data || 0) : 0;
    } catch (error) {
      logger.error('Failed to rpush:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async lpop(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'queue',
        operation: {
          operation: 'rpop', // Using rpop as lpop equivalent
          key
        }
      });
      if (response.success && response.data) {
        return JSON.parse(response.data);
      }
      return null;
    } catch (error) {
      logger.error('Failed to lpop:', { error: (error as any)?.message });
      return null;
    }
  }

  public async rpop(key: string): Promise<any | null> {
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
    } catch (error) {
      logger.error('Failed to rpop:', { error: (error as any)?.message });
      return null;
    }
  }

  public async lrange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      // Note: lrange may not be supported by Redis service, using alternative approach
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'queue',
        operation: {
          operation: 'llen',
          key
        }
      });
      // For now, return empty array as lrange may need custom implementation
      return [];
    } catch (error) {
      logger.error('Failed to lrange:', { error: (error as any)?.message });
      return [];
    }
  }

  // Set operations
  public async sadd(key: string, ...members: any[]): Promise<number> {
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
    } catch (error) {
      logger.error('Failed to sadd:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async smembers(key: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'cache',
        operation: {
          operation: 'smembers',
          key
        }
      });
      if (response.success && response.data) {
        return response.data.map((value: string) => JSON.parse(value));
      }
      return [];
    } catch (error) {
      logger.error('Failed to smembers:', { error: (error as any)?.message });
      return [];
    }
  }

  public async srem(key: string, ...members: any[]): Promise<number> {
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
    } catch (error) {
      logger.error('Failed to srem:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async sismember(key: string, member: any): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to sismember:', { error: (error as any)?.message });
      return false;
    }
  }

  // Utility operations
  public async exists(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/execute', {
        instance: 'cache',
        operation: {
          operation: 'exists',
          key
        }
      });
      return response.success ? (response.data || false) : false;
    } catch (error) {
      logger.error('Failed to check existence:', { error: (error as any)?.message });
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
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
    } catch (error) {
      logger.error('Failed to set expiration:', { error: (error as any)?.message });
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      // Note: TTL operation may need custom implementation in Redis service
      // For now, return -1 as placeholder
      return -1;
    } catch (error) {
      logger.error('Failed to get TTL:', { error: (error as any)?.message });
      return -1;
    }
  }

  // Health check
  public async healthCheck(): Promise<{ session: boolean; cache: boolean; queue: boolean }> {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response && response.redis) {
        return response.redis;
      }
      return { session: false, cache: false, queue: false };
    } catch (error) {
      logger.error('Redis service health check failed:', { error: (error as any)?.message });
      return { session: false, cache: false, queue: false };
    }
  }

  // Private method to make HTTP requests
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: any = {
      method,
      url,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add data to request body for POST requests
    if (method === 'POST' && data) {
      config.data = data;
    } else if (method === 'GET' && data) {
      // For GET requests, add as query params if needed
      config.params = data;
    }

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await axios(config);
        return response.data;
      } catch (error: any) {
        lastError = error;
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        } else {
          // If all retries failed, throw the error
          throw error;
        }
      }
    }

    throw lastError;
  }
}

export default RedisService;