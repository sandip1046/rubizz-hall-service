"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorHandler = void 0;
const client_1 = require("@prisma/client");
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
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const prismaError = ErrorHandler.handlePrismaError(error);
            statusCode = prismaError.statusCode;
            message = prismaError.message;
            details = prismaError.details;
        }
        else if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            statusCode = 400;
            message = 'Invalid data provided';
            details = { validation: error.message };
        }
        else if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
            statusCode = 503;
            message = 'Database connection failed';
            details = { database: error.message };
        }
        else if (error instanceof client_1.Prisma.PrismaClientRustPanicError) {
            statusCode = 503;
            message = 'Database engine error';
            details = { database: error.message };
        }
        else if (error.name === 'ValidationError') {
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
    static handlePrismaError(error) {
        switch (error.code) {
            case 'P2000':
                return {
                    statusCode: 400,
                    message: 'The provided value is too long',
                    details: { field: error.meta?.target },
                };
            case 'P2001':
                return {
                    statusCode: 404,
                    message: 'Record not found',
                    details: { model: error.meta?.model_name },
                };
            case 'P2002':
                return {
                    statusCode: 409,
                    message: 'Unique constraint violation',
                    details: {
                        field: error.meta?.target,
                        constraint: 'unique',
                    },
                };
            case 'P2003':
                return {
                    statusCode: 400,
                    message: 'Foreign key constraint violation',
                    details: {
                        field: error.meta?.field_name,
                        constraint: 'foreign_key',
                    },
                };
            case 'P2004':
                return {
                    statusCode: 400,
                    message: 'Constraint violation',
                    details: { constraint: error.meta?.constraint },
                };
            case 'P2005':
                return {
                    statusCode: 400,
                    message: 'Invalid value for field',
                    details: {
                        field: error.meta?.field_name,
                        value: error.meta?.field_value,
                    },
                };
            case 'P2006':
                return {
                    statusCode: 400,
                    message: 'Invalid value provided',
                    details: { field: error.meta?.target },
                };
            case 'P2007':
                return {
                    statusCode: 400,
                    message: 'Data validation error',
                    details: { validation: error.meta },
                };
            case 'P2008':
                return {
                    statusCode: 400,
                    message: 'Query parsing error',
                    details: { query: error.meta?.query_parsing_error },
                };
            case 'P2009':
                return {
                    statusCode: 400,
                    message: 'Query validation error',
                    details: { query: error.meta?.query_validation_error },
                };
            case 'P2010':
                return {
                    statusCode: 500,
                    message: 'Raw query failed',
                    details: { query: error.meta?.query },
                };
            case 'P2011':
                return {
                    statusCode: 400,
                    message: 'Null constraint violation',
                    details: { field: error.meta?.constraint },
                };
            case 'P2012':
                return {
                    statusCode: 400,
                    message: 'Missing required value',
                    details: { field: error.meta?.path },
                };
            case 'P2013':
                return {
                    statusCode: 400,
                    message: 'Missing required argument',
                    details: { argument: error.meta?.argument_name },
                };
            case 'P2014':
                return {
                    statusCode: 400,
                    message: 'Relation violation',
                    details: {
                        relation: error.meta?.relation_name,
                        field: error.meta?.field_name,
                    },
                };
            case 'P2015':
                return {
                    statusCode: 404,
                    message: 'Related record not found',
                    details: {
                        model: error.meta?.model_name,
                        field: error.meta?.field_name,
                    },
                };
            case 'P2016':
                return {
                    statusCode: 400,
                    message: 'Query interpretation error',
                    details: { details: error.meta?.details },
                };
            case 'P2017':
                return {
                    statusCode: 400,
                    message: 'Records for relation not connected',
                    details: {
                        relation: error.meta?.relation_name,
                        field: error.meta?.field_name,
                    },
                };
            case 'P2018':
                return {
                    statusCode: 400,
                    message: 'Required connected records not found',
                    details: {
                        relation: error.meta?.relation_name,
                        field: error.meta?.field_name,
                    },
                };
            case 'P2019':
                return {
                    statusCode: 400,
                    message: 'Input error',
                    details: { details: error.meta?.details },
                };
            case 'P2020':
                return {
                    statusCode: 400,
                    message: 'Value out of range',
                    details: {
                        field: error.meta?.target,
                        value: error.meta?.value,
                    },
                };
            case 'P2021':
                return {
                    statusCode: 404,
                    message: 'Table does not exist',
                    details: { table: error.meta?.table },
                };
            case 'P2022':
                return {
                    statusCode: 404,
                    message: 'Column does not exist',
                    details: { column: error.meta?.column },
                };
            case 'P2025':
                return {
                    statusCode: 404,
                    message: 'Record not found for update',
                    details: { cause: error.meta?.cause },
                };
            default:
                return {
                    statusCode: 500,
                    message: 'Database operation failed',
                    details: { code: error.code },
                };
        }
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