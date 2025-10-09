import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                role: string;
                permissions: string[];
            };
        }
    }
}
export declare class AuthMiddleware {
    static verifyToken(req: Request, res: Response, next: NextFunction): Promise<void>;
    static requireRole(roles: string | string[]): (req: Request, res: Response, next: NextFunction) => void;
    static requirePermission(permissions: string | string[]): (req: Request, res: Response, next: NextFunction) => void;
    static requireAdmin(req: Request, res: Response, next: NextFunction): void;
    static requireCustomer(req: Request, res: Response, next: NextFunction): void;
    static optionalAuth(req: Request, res: Response, next: NextFunction): void;
    static validateApiGateway(req: Request, res: Response, next: NextFunction): void;
    static logout(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.d.ts.map