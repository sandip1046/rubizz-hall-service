import winston from 'winston';
export declare const logger: winston.Logger;
export declare const morganStream: {
    write: (message: string) => void;
};
export declare const logRequest: (req: any, res: any, responseTime: number) => void;
export declare const logError: (error: Error, context?: any) => void;
export declare const logDatabaseQuery: (query: string, params: any, duration: number) => void;
export declare const logBusinessEvent: (event: string, data: any) => void;
export declare const logSecurityEvent: (event: string, data: any) => void;
export declare const logPerformanceMetric: (metric: string, value: number, unit?: string) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map