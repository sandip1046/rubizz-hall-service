"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const logger_1 = require("@/utils/logger");
class ErrorHandler {
    static handle(error, req, res, next) {
        logger_1.logger.error('Unhandled error:', {
            error: error.message,
            stack: error.stack,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            userId: req.user?.id,
        });
        let statusCode = 500;
        let message = 'Internal server error';
        let details = undefined;
        if (error.name === 'ValidationError') {
            statusCode = 400;
            message = 'Validation failed';
            details = { validation: error.message };
        }
        else if (error.name === 'UnauthorizedError') {
            statusCode = 401;
            message = 'Unauthorized access';
        }
        else if (error.name === 'ForbiddenError') {
            statusCode = 403;
            message = 'Access forbidden';
        }
        else if (error.name === 'NotFoundError') {
            statusCode = 404;
            message = 'Resource not found';
        }
        else if (error.name === 'ConflictError') {
            statusCode = 409;
            message = 'Resource conflict';
        }
        else if (error.name === 'BadRequestError') {
            statusCode = 400;
            message = 'Bad request';
        }
        else if (error.name === 'TimeoutError') {
            statusCode = 408;
            message = 'Request timeout';
        }
        else if (error.name === 'RateLimitError') {
            statusCode = 429;
            message = 'Too many requests';
        }
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
        };
        if (details) {
            response.details = details;
        }
        if (process.env.NODE_ENV === 'production' && statusCode === 500) {
            response.message = 'Internal server error';
            delete response.details;
        }
        res.status(statusCode).json(response);
    }
    static handleNotFound(req, res) {
        logger_1.logger.warn('Route not found', {
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        const response = {
            success: false,
            message: 'Route not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'],
        };
        res.status(404).json(response);
    }
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    static createError(message, statusCode = 500, name = 'CustomError') {
        const error = new Error(message);
        error.name = name;
        error.statusCode = statusCode;
        return error;
    }
    static BadRequest(message = 'Bad request') {
        return ErrorHandler.createError(message, 400, 'BadRequestError');
    }
    static Unauthorized(message = 'Unauthorized') {
        return ErrorHandler.createError(message, 401, 'UnauthorizedError');
    }
    static Forbidden(message = 'Forbidden') {
        return ErrorHandler.createError(message, 403, 'ForbiddenError');
    }
    static NotFound(message = 'Not found') {
        return ErrorHandler.createError(message, 404, 'NotFoundError');
    }
    static Conflict(message = 'Conflict') {
        return ErrorHandler.createError(message, 409, 'ConflictError');
    }
    static Timeout(message = 'Request timeout') {
        return ErrorHandler.createError(message, 408, 'TimeoutError');
    }
    static RateLimit(message = 'Too many requests') {
        return ErrorHandler.createError(message, 429, 'RateLimitError');
    }
}
exports.ErrorHandler = ErrorHandler;
exports.default = ErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map