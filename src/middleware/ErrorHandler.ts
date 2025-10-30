import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

export class ErrorHandler {
  /**
   * Global error handler middleware
   */
  public static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    logger.error('Unhandled error:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
    });

    // Default error response
    let statusCode = 500;
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle different types of errors
    if (error.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      details = { validation: error.message };
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized access';
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
      message = 'Access forbidden';
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (error.name === 'ConflictError') {
      statusCode = 409;
      message = 'Resource conflict';
    } else if (error.name === 'BadRequestError') {
      statusCode = 400;
      message = 'Bad request';
    } else if (error.name === 'TimeoutError') {
      statusCode = 408;
      message = 'Request timeout';
    } else if (error.name === 'RateLimitError') {
      statusCode = 429;
      message = 'Too many requests';
    }

    const response: ApiResponse = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    if (details) {
      (response as any).details = details;
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      response.message = 'Internal server error';
      delete (response as any).details;
    }

    res.status(statusCode).json(response);
  }

  // Prisma-specific handling removed after migration to Mongoose

  /**
   * Handle 404 errors for undefined routes
   */
  public static handleNotFound(req: Request, res: Response): void {
    logger.warn('Route not found', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    const response: ApiResponse = {
      success: false,
      message: 'Route not found',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    };

    res.status(404).json(response);
  }

  /**
   * Handle async errors
   */
  public static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Custom error classes
   */
  public static createError(message: string, statusCode: number = 500, name: string = 'CustomError') {
    const error = new Error(message);
    error.name = name;
    (error as any).statusCode = statusCode;
    return error;
  }

  public static BadRequest(message: string = 'Bad request') {
    return ErrorHandler.createError(message, 400, 'BadRequestError');
  }

  public static Unauthorized(message: string = 'Unauthorized') {
    return ErrorHandler.createError(message, 401, 'UnauthorizedError');
  }

  public static Forbidden(message: string = 'Forbidden') {
    return ErrorHandler.createError(message, 403, 'ForbiddenError');
  }

  public static NotFound(message: string = 'Not found') {
    return ErrorHandler.createError(message, 404, 'NotFoundError');
  }

  public static Conflict(message: string = 'Conflict') {
    return ErrorHandler.createError(message, 409, 'ConflictError');
  }

  public static Timeout(message: string = 'Request timeout') {
    return ErrorHandler.createError(message, 408, 'TimeoutError');
  }

  public static RateLimit(message: string = 'Too many requests') {
    return ErrorHandler.createError(message, 429, 'RateLimitError');
  }
}

export default ErrorHandler;
