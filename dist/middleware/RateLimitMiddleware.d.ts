import { Request } from 'express';
export declare class RateLimitMiddleware {
    static general: import("express-rate-limit").RateLimitRequestHandler;
    static strict: import("express-rate-limit").RateLimitRequestHandler;
    static auth: import("express-rate-limit").RateLimitRequestHandler;
    static apiKey: import("express-rate-limit").RateLimitRequestHandler;
    static fileUpload: import("express-rate-limit").RateLimitRequestHandler;
    static create(options: {
        windowMs: number;
        max: number;
        message?: string;
        keyGenerator?: (req: Request) => string;
        skip?: (req: Request) => boolean;
    }): import("express-rate-limit").RateLimitRequestHandler;
    static resetRateLimit(key: string): Promise<void>;
    static getRateLimitStatus(key: string): Promise<{
        totalHits: number;
        resetTime: Date;
        remaining: number;
    } | null>;
}
export default RateLimitMiddleware;
//# sourceMappingURL=RateLimitMiddleware.d.ts.map