export declare class RedisService {
    private baseUrl;
    private timeout;
    private retries;
    private retryDelay;
    private isConnected;
    constructor();
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isServiceConnected(): boolean;
    setSession(sessionId: string, data: any, ttl?: number): Promise<boolean>;
    getSession(sessionId: string): Promise<any | null>;
    deleteSession(sessionId: string): Promise<boolean>;
    setCache(key: string, data: any, ttl?: number): Promise<boolean>;
    getCache(key: string): Promise<any | null>;
    deleteCache(key: string): Promise<boolean>;
    pushToQueue(queueName: string, data: any): Promise<number>;
    popFromQueue(queueName: string): Promise<any | null>;
    getQueueLength(queueName: string): Promise<number>;
    hset(key: string, field: string, value: any): Promise<boolean>;
    hget(key: string, field: string): Promise<any | null>;
    hgetall(key: string): Promise<Record<string, any>>;
    hdel(key: string, field: string): Promise<boolean>;
    lpush(key: string, ...values: any[]): Promise<number>;
    rpush(key: string, ...values: any[]): Promise<number>;
    lpop(key: string): Promise<any | null>;
    rpop(key: string): Promise<any | null>;
    lrange(key: string, start: number, stop: number): Promise<any[]>;
    sadd(key: string, ...members: any[]): Promise<number>;
    smembers(key: string): Promise<any[]>;
    srem(key: string, ...members: any[]): Promise<number>;
    sismember(key: string, member: any): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<boolean>;
    ttl(key: string): Promise<number>;
    healthCheck(): Promise<{
        session: boolean;
        cache: boolean;
        queue: boolean;
    }>;
    private makeRequest;
}
export default RedisService;
//# sourceMappingURL=RedisService.d.ts.map