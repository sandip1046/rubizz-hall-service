import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { redis } from '@/database/RedisConnection';
import { ApiResponse } from '@/types';

// Extend Request interface to include user
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

interface JwtPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  /**
   * Verify JWT token and extract user information
   */
  public static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: ApiResponse = {
          success: false,
          message: 'Access token is required',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Check if token is blacklisted
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        const response: ApiResponse = {
          success: false,
          message: 'Token has been revoked',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      
      // Check if user session exists in Redis
      const sessionKey = `session:${decoded.id}`;
      const sessionData = await redis.get(sessionKey);
      
      if (!sessionData) {
        const response: ApiResponse = {
          success: false,
          message: 'Session expired or invalid',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      // Parse session data
      const session = JSON.parse(sessionData);
      
      // Check if token matches session token
      if (session.token !== token) {
        const response: ApiResponse = {
          success: false,
          message: 'Invalid token for current session',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      // Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };

      // Update last activity
      await redis.expire(sessionKey, 24 * 60 * 60); // 24 hours

      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      
      const response: ApiResponse = {
        success: false,
        message: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
    }
  }

  /**
   * Check if user has required role
   */
  public static requireRole(roles: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        const response: ApiResponse = {
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
        logger.warn('Access denied - insufficient role', {
          userId: req.user.id,
          userRole,
          requiredRoles,
          endpoint: req.path,
        });

        const response: ApiResponse = {
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

  /**
   * Check if user has required permission
   */
  public static requirePermission(permissions: string | string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        const response: ApiResponse = {
          success: false,
          message: 'Authentication required',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      const userPermissions = req.user.permissions || [];
      const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];

      const hasPermission = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.id,
          userPermissions,
          requiredPermissions,
          endpoint: req.path,
        });

        const response: ApiResponse = {
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

  /**
   * Check if user is admin or super admin
   */
  public static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    const adminRoles = ['admin', 'super_admin'];
    if (!adminRoles.includes(req.user.role)) {
      logger.warn('Access denied - admin role required', {
        userId: req.user.id,
        userRole: req.user.role,
        endpoint: req.path,
      });

      const response: ApiResponse = {
        success: false,
        message: 'Admin access required',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    next();
  }

  /**
   * Check if user is customer
   */
  public static requireCustomer(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    if (req.user.role !== 'customer') {
      logger.warn('Access denied - customer role required', {
        userId: req.user.id,
        userRole: req.user.role,
        endpoint: req.path,
      });

      const response: ApiResponse = {
        success: false,
        message: 'Customer access required',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    next();
  }

  /**
   * Optional authentication - doesn't fail if no token
   */
  public static optionalAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      // Ignore token errors for optional auth
      logger.debug('Optional auth token verification failed:', error);
    }

    next();
  }

  /**
   * Validate API Gateway secret
   */
  public static validateApiGateway(req: Request, res: Response, next: NextFunction): void {
    const gatewaySecret = req.headers['x-api-gateway-secret'];
    
    if (!gatewaySecret || gatewaySecret !== config.apiGateway.secret) {
      logger.warn('Invalid API Gateway secret', {
        providedSecret: gatewaySecret,
        endpoint: req.path,
        ip: req.ip,
      });

      const response: ApiResponse = {
        success: false,
        message: 'Unauthorized access',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    next();
  }

  /**
   * Logout user by blacklisting token
   */
  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        // Blacklist token
        const tokenExpiry = jwt.decode(token) as JwtPayload;
        if (tokenExpiry && tokenExpiry.exp) {
          const ttl = tokenExpiry.exp - Math.floor(Date.now() / 1000);
          if (ttl > 0) {
            await redis.set(`blacklist:${token}`, 'true', ttl);
          }
        }

        // Remove session
        if (req.user) {
          const sessionKey = `session:${req.user.id}`;
          await redis.del(sessionKey);
        }
      }

      next();
    } catch (error) {
      logger.error('Logout error:', error);
      next();
    }
  }
}

export default AuthMiddleware;
