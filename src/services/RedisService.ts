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
      return await this.setCache(`session:${sessionId}`, data, ttl);
    } catch (error) {
      logger.error('Failed to set session:', { error: (error as any)?.message });
      return false;
    }
  }

  public async getSession(sessionId: string): Promise<any | null> {
    try {
      return await this.getCache(`session:${sessionId}`);
    } catch (error) {
      logger.error('Failed to get session:', { error: (error as any)?.message });
      return null;
    }
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    try {
      return await this.deleteCache(`session:${sessionId}`);
    } catch (error) {
      logger.error('Failed to delete session:', { error: (error as any)?.message });
      return false;
    }
  }

  // Cache operations
  public async setCache(key: string, data: any, ttl: number = 3600): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/cache', {
        key: `cache:${key}`,
        value: JSON.stringify(data),
        ttl
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to set cache:', { error: (error as any)?.message });
      return false;
    }
  }

  public async getCache(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/cache/${encodeURIComponent(`cache:${key}`)}`);
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
      const response = await this.makeRequest('DELETE', `/cache/${encodeURIComponent(`cache:${key}`)}`);
      return response.success;
    } catch (error) {
      logger.error('Failed to delete cache:', { error: (error as any)?.message });
      return false;
    }
  }

  // Queue operations
  public async pushToQueue(queueName: string, data: any): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/queue', {
        queue: `queue:${queueName}`,
        value: JSON.stringify(data)
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to push to queue:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async popFromQueue(queueName: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}`);
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
      const response = await this.makeRequest('GET', `/queue/${encodeURIComponent(`queue:${queueName}`)}/length`);
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to get queue length:', { error: (error as any)?.message });
      return 0;
    }
  }

  // Hash operations
  public async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/hash', {
        key,
        field,
        value: JSON.stringify(value)
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to hset:', { error: (error as any)?.message });
      return false;
    }
  }

  public async hget(key: string, field: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
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
      const response = await this.makeRequest('GET', `/hash/${encodeURIComponent(key)}`);
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
      const response = await this.makeRequest('DELETE', `/hash/${encodeURIComponent(key)}/${encodeURIComponent(field)}`);
      return response.success;
    } catch (error) {
      logger.error('Failed to hdel:', { error: (error as any)?.message });
      return false;
    }
  }

  // List operations
  public async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/list/lpush', {
        key,
        values: values.map(value => JSON.stringify(value))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to lpush:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async rpush(key: string, ...values: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/list/rpush', {
        key,
        values: values.map(value => JSON.stringify(value))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to rpush:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async lpop(key: string): Promise<any | null> {
    try {
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/lpop`);
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
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/rpop`);
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
      const response = await this.makeRequest('GET', `/list/${encodeURIComponent(key)}/range?start=${start}&stop=${stop}`);
      if (response.success && response.data) {
        return response.data.map((value: string) => JSON.parse(value));
      }
      return [];
    } catch (error) {
      logger.error('Failed to lrange:', { error: (error as any)?.message });
      return [];
    }
  }

  // Set operations
  public async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const response = await this.makeRequest('POST', '/set', {
        key,
        members: members.map(member => JSON.stringify(member))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to sadd:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async smembers(key: string): Promise<any[]> {
    try {
      const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}`);
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
      const response = await this.makeRequest('DELETE', '/set', {
        key,
        members: members.map(member => JSON.stringify(member))
      });
      return response.success ? response.data : 0;
    } catch (error) {
      logger.error('Failed to srem:', { error: (error as any)?.message });
      return 0;
    }
  }

  public async sismember(key: string, member: any): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `/set/${encodeURIComponent(key)}/ismember?member=${encodeURIComponent(JSON.stringify(member))}`);
      return response.success ? response.data : false;
    } catch (error) {
      logger.error('Failed to sismember:', { error: (error as any)?.message });
      return false;
    }
  }

  // Utility operations
  public async exists(key: string): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', `/exists/${encodeURIComponent(key)}`);
      return response.success ? response.data : false;
    } catch (error) {
      logger.error('Failed to check existence:', { error: (error as any)?.message });
      return false;
    }
  }

  public async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const response = await this.makeRequest('POST', '/expire', {
        key,
        ttl
      });
      return response.success;
    } catch (error) {
      logger.error('Failed to set expiration:', { error: (error as any)?.message });
      return false;
    }
  }

  public async ttl(key: string): Promise<number> {
    try {
      const response = await this.makeRequest('GET', `/ttl/${encodeURIComponent(key)}`);
      return response.success ? response.data : -1;
    } catch (error) {
      logger.error('Failed to get TTL:', { error: (error as any)?.message });
      return -1;
    }
  }

  // Health check
  public async healthCheck(): Promise<{ session: boolean; cache: boolean; queue: boolean }> {
    try {
      const response = await this.makeRequest('GET', '/health');
      if (response.success && response.data) {
        return response.data.redis || { session: false, cache: false, queue: false };
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
    const config = {
      method,
      url,
      timeout: this.timeout,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let lastError: any;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await axios(config);
        return response.data;
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
      }
    }

    throw lastError;
  }
}

export default RedisService;