import { Request, Response, NextFunction } from 'express';
export declare class ErrorHandler {
    static handle(error: Error, req: Request, res: Response, next: NextFunction): void;
    static handleNotFound(req: Request, res: Response): void;
    static asyncHandler(fn: Function): (req: Request, res: Response, next: NextFunction) => void;
    static createError(message: string, statusCode?: number, name?: string): Error;
    static BadRequest(message?: string): Error;
    static Unauthorized(message?: string): Error;
    static Forbidden(message?: string): Error;
    static NotFound(message?: string): Error;
    static Conflict(message?: string): Error;
    static Timeout(message?: string): Error;
    static RateLimit(message?: string): Error;
}
export default ErrorHandler;
//# sourceMappingURL=ErrorHandler.d.ts.map