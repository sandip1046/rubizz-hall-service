"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
const RedisService_1 = require("@/services/RedisService");
class AuthMiddleware {
    static async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                const response = {
                    success: false,
                    message: 'Access token is required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            const token = authHeader.substring(7);
            const isBlacklisted = await AuthMiddleware.redisService.exists(`blacklist:${token}`);
            if (isBlacklisted) {
                const response = {
                    success: false,
                    message: 'Token has been revoked',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            const sessionKey = `session:${decoded.id}`;
            const sessionData = await AuthMiddleware.redisService.getCache(sessionKey);
            if (!sessionData) {
                const response = {
                    success: false,
                    message: 'Session expired or invalid',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            const session = sessionData;
            if (session.token !== token) {
                const response = {
                    success: false,
                    message: 'Invalid token for current session',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions || [],
            };
            await AuthMiddleware.redisService.expire(sessionKey, 24 * 60 * 60);
            next();
        }
        catch (error) {
            logger_1.logger.error('Token verification failed:', error);
            const response = {
                success: false,
                message: 'Invalid or expired token',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
        }
    }
    static requireRole(roles) {
        return (req, res, next) => {
            if (!req.user) {
                const response = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            const userRole = req.user.role;
            const requiredRoles = Array.isArray(roles) ? roles : [roles];
            if (!requiredRoles.includes(userRole)) {
                logger_1.logger.warn('Access denied - insufficient role', {
                    userId: req.user.id,
                    userRole,
                    requiredRoles,
                    endpoint: req.path,
                });
                const response = {
                    success: false,
                    message: 'Insufficient permissions',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }
            next();
        };
    }
    static requirePermission(permissions) {
        return (req, res, next) => {
            if (!req.user) {
                const response = {
                    success: false,
                    message: 'Authentication required',
                    timestamp: new Date().toISOString(),
                };
                res.status(401).json(response);
                return;
            }
            const userPermissions = req.user.permissions || [];
            const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
            const hasPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
            if (!hasPermission) {
                logger_1.logger.warn('Access denied - insufficient permissions', {
                    userId: req.user.id,
                    userPermissions,
                    requiredPermissions,
                    endpoint: req.path,
                });
                const response = {
                    success: false,
                    message: 'Insufficient permissions',
                    timestamp: new Date().toISOString(),
                };
                res.status(403).json(response);
                return;
            }
            next();
        };
    }
    static requireAdmin(req, res, next) {
        if (!req.user) {
            const response = {
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
            return;
        }
        const adminRoles = ['admin', 'super_admin'];
        if (!adminRoles.includes(req.user.role)) {
            logger_1.logger.warn('Access denied - admin role required', {
                userId: req.user.id,
                userRole: req.user.role,
                endpoint: req.path,
            });
            const response = {
                success: false,
                message: 'Admin access required',
                timestamp: new Date().toISOString(),
            };
            res.status(403).json(response);
            return;
        }
        next();
    }
    static requireCustomer(req, res, next) {
        if (!req.user) {
            const response = {
                success: false,
                message: 'Authentication required',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
            return;
        }
        if (req.user.role !== 'customer') {
            logger_1.logger.warn('Access denied - customer role required', {
                userId: req.user.id,
                userRole: req.user.role,
                endpoint: req.path,
            });
            const response = {
                success: false,
                message: 'Customer access required',
                timestamp: new Date().toISOString(),
            };
            res.status(403).json(response);
            return;
        }
        next();
    }
    static optionalAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            next();
            return;
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
                permissions: decoded.permissions || [],
            };
        }
        catch (error) {
            logger_1.logger.debug('Optional auth token verification failed:', error);
        }
        next();
    }
    static validateApiGateway(req, res, next) {
        const gatewaySecret = req.headers['x-api-gateway-secret'];
        if (!gatewaySecret || gatewaySecret !== config_1.config.apiGateway.secret) {
            logger_1.logger.warn('Invalid API Gateway secret', {
                providedSecret: gatewaySecret,
                endpoint: req.path,
                ip: req.ip,
            });
            const response = {
                success: false,
                message: 'Unauthorized access',
                timestamp: new Date().toISOString(),
            };
            res.status(401).json(response);
            return;
        }
        next();
    }
    static async logout(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const tokenExpiry = jsonwebtoken_1.default.decode(token);
                if (tokenExpiry && tokenExpiry.exp) {
                    const ttl = tokenExpiry.exp - Math.floor(Date.now() / 1000);
                    if (ttl > 0) {
                        await AuthMiddleware.redisService.setCache(`blacklist:${token}`, 'true', ttl);
                    }
                }
                if (req.user) {
                    const sessionKey = `session:${req.user.id}`;
                    await AuthMiddleware.redisService.deleteCache(sessionKey);
                }
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            next();
        }
    }
}
exports.AuthMiddleware = AuthMiddleware;
AuthMiddleware.redisService = new RedisService_1.RedisService();
exports.default = AuthMiddleware;
//# sourceMappingURL=AuthMiddleware.js.map