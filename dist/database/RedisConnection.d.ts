import { Redis as RedisType } from 'ioredis';
declare class RedisConnection {
    private static instance;
    private sessionClient;
    private cacheClient;
    private queueClient;
    private constructor();
    static getInstance(): RedisConnection;
    getSessionClient(): RedisType;
    getCacheClient(): RedisType;
    getQueueClient(): RedisType;
    getClient(): RedisType;
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    healthCheck(): Promise<boolean>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<boolean>;
    del(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttlSeconds: number): Promise<boolean>;
    hGet(key: string, field: string): Promise<string | null>;
    hSet(key: string, field: string, value: string): Promise<boolean>;
    hGetAll(key: string): Promise<Record<string, string>>;
    hDel(key: string, field: string): Promise<boolean>;
    lPush(key: string, ...values: string[]): Promise<number>;
    rPush(key: string, ...values: string[]): Promise<number>;
    lPop(key: string): Promise<string | null>;
    rPop(key: string): Promise<string | null>;
    lRange(key: string, start: number, stop: number): Promise<string[]>;
    sAdd(key: string, ...members: string[]): Promise<number>;
    sRem(key: string, ...members: string[]): Promise<number>;
    sMembers(key: string): Promise<string[]>;
    sIsMember(key: string, member: string): Promise<boolean>;
}
export declare const redis: RedisConnection;
export default redis;
//# sourceMappingURL=RedisConnection.d.ts.map