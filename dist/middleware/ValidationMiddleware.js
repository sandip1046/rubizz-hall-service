"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationSchemas = exports.ValidationMiddleware = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("@/utils/logger");
class ValidationMiddleware {
    static validateBody(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                const errorDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));
                logger_1.logger.warn('Validation error', {
                    errors: errorDetails,
                    url: req.url,
                    method: req.method,
                    userId: req.user?.id,
                });
                const response = {
                    success: false,
                    message: 'Validation failed',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                response.errors = errorDetails;
                res.status(400).json(response);
                return;
            }
            req.body = value;
            next();
        };
    }
    static validateQuery(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.query, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                const errorDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));
                logger_1.logger.warn('Query validation error', {
                    errors: errorDetails,
                    url: req.url,
                    method: req.method,
                    userId: req.user?.id,
                });
                const response = {
                    success: false,
                    message: 'Query validation failed',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                response.errors = errorDetails;
                res.status(400).json(response);
                return;
            }
            req.query = value;
            next();
        };
    }
    static validateParams(schema) {
        return (req, res, next) => {
            const { error, value } = schema.validate(req.params, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                const errorDetails = error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                    value: detail.context?.value,
                }));
                logger_1.logger.warn('Params validation error', {
                    errors: errorDetails,
                    url: req.url,
                    method: req.method,
                    userId: req.user?.id,
                });
                const response = {
                    success: false,
                    message: 'Parameter validation failed',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                response.errors = errorDetails;
                res.status(400).json(response);
                return;
            }
            req.params = value;
            next();
        };
    }
    static validateFile(options = {}) {
        return (req, res, next) => {
            const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;
            const file = req.file;
            if (required && !file) {
                const response = {
                    success: false,
                    message: 'File is required',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(400).json(response);
                return;
            }
            if (file) {
                if (file.size > maxSize) {
                    const response = {
                        success: false,
                        message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
                    const response = {
                        success: false,
                        message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
            }
            next();
        };
    }
    static validateUuid(field = 'id') {
        return ValidationMiddleware.validateParams(joi_1.default.object({
            [field]: joi_1.default.string().uuid().required(),
        }));
    }
}
exports.ValidationMiddleware = ValidationMiddleware;
ValidationMiddleware.validatePagination = ValidationMiddleware.validateQuery(joi_1.default.object({
    page: joi_1.default.number().integer().min(1).default(1),
    limit: joi_1.default.number().integer().min(1).max(100).default(10),
    sortBy: joi_1.default.string().valid('createdAt', 'updatedAt', 'name', 'capacity', 'baseRate', 'eventDate', 'totalAmount').default('createdAt'),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc'),
}));
ValidationMiddleware.validateDateRange = ValidationMiddleware.validateQuery(joi_1.default.object({
    startDate: joi_1.default.date().iso().optional(),
    endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
}));
ValidationMiddleware.validateSearchFilters = ValidationMiddleware.validateQuery(joi_1.default.object({
    search: joi_1.default.string().min(1).max(100).optional(),
    status: joi_1.default.string().valid('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW').optional(),
    eventType: joi_1.default.string().valid('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'SEMINAR', 'PARTY', 'MEETING', 'OTHER').optional(),
    paymentStatus: joi_1.default.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED').optional(),
    isConfirmed: joi_1.default.boolean().optional(),
    isCancelled: joi_1.default.boolean().optional(),
}));
exports.ValidationSchemas = {
    createHall: joi_1.default.object({
        name: joi_1.default.string().min(1).max(100).required(),
        description: joi_1.default.string().max(500).optional(),
        capacity: joi_1.default.number().integer().min(1).max(10000).required(),
        area: joi_1.default.number().positive().optional(),
        location: joi_1.default.string().min(1).max(200).required(),
        floor: joi_1.default.string().max(50).optional(),
        amenities: joi_1.default.array().items(joi_1.default.string().max(50)).optional().default([]),
        baseRate: joi_1.default.number().positive().required(),
        hourlyRate: joi_1.default.number().positive().optional(),
        dailyRate: joi_1.default.number().positive().optional(),
        weekendRate: joi_1.default.number().positive().optional(),
        images: joi_1.default.array().items(joi_1.default.string().uri()).optional().default([]),
        floorPlan: joi_1.default.string().uri().optional(),
    }),
    updateHall: joi_1.default.object({
        name: joi_1.default.string().min(1).max(100).optional(),
        description: joi_1.default.string().max(500).optional(),
        capacity: joi_1.default.number().integer().min(1).max(10000).optional(),
        area: joi_1.default.number().positive().optional(),
        location: joi_1.default.string().min(1).max(200).optional(),
        floor: joi_1.default.string().max(50).optional(),
        amenities: joi_1.default.array().items(joi_1.default.string().max(50)).optional(),
        baseRate: joi_1.default.number().positive().optional(),
        hourlyRate: joi_1.default.number().positive().optional(),
        dailyRate: joi_1.default.number().positive().optional(),
        weekendRate: joi_1.default.number().positive().optional(),
        isActive: joi_1.default.boolean().optional(),
        isAvailable: joi_1.default.boolean().optional(),
        images: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
        floorPlan: joi_1.default.string().uri().optional(),
    }),
    createBooking: joi_1.default.object({
        hallId: joi_1.default.string().uuid().required(),
        customerId: joi_1.default.string().uuid().required(),
        eventName: joi_1.default.string().min(1).max(200).required(),
        eventType: joi_1.default.string().valid('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'SEMINAR', 'PARTY', 'MEETING', 'OTHER').required(),
        startDate: joi_1.default.date().iso().min('now').required(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        guestCount: joi_1.default.number().integer().min(1).max(10000).required(),
        specialRequests: joi_1.default.string().max(1000).optional(),
        quotationId: joi_1.default.string().uuid().optional(),
    }),
    updateBooking: joi_1.default.object({
        eventName: joi_1.default.string().min(1).max(200).optional(),
        eventType: joi_1.default.string().valid('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'SEMINAR', 'PARTY', 'MEETING', 'OTHER').optional(),
        startDate: joi_1.default.date().iso().min('now').optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        guestCount: joi_1.default.number().integer().min(1).max(10000).optional(),
        specialRequests: joi_1.default.string().max(1000).optional(),
        status: joi_1.default.string().valid('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW').optional(),
        cancellationReason: joi_1.default.string().max(500).optional(),
    }),
    createQuotation: joi_1.default.object({
        hallId: joi_1.default.string().uuid().required(),
        customerId: joi_1.default.string().uuid().required(),
        eventName: joi_1.default.string().min(1).max(200).required(),
        eventType: joi_1.default.string().valid('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'SEMINAR', 'PARTY', 'MEETING', 'OTHER').required(),
        eventDate: joi_1.default.date().iso().min('now').required(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        guestCount: joi_1.default.number().integer().min(1).max(10000).required(),
        lineItems: joi_1.default.array().items(joi_1.default.object({
            itemType: joi_1.default.string().valid('HALL_RENTAL', 'CHAIR', 'TABLE', 'DECORATION', 'LIGHTING', 'AV_EQUIPMENT', 'CATERING', 'SECURITY', 'GENERATOR', 'CLEANING', 'PARKING', 'OTHER').required(),
            itemName: joi_1.default.string().min(1).max(100).required(),
            description: joi_1.default.string().max(200).optional(),
            quantity: joi_1.default.number().integer().min(1).required(),
            unitPrice: joi_1.default.number().positive().required(),
            specifications: joi_1.default.object().optional(),
        })).min(1).required(),
        validUntil: joi_1.default.date().iso().min('now').optional(),
    }),
    updateQuotation: joi_1.default.object({
        eventName: joi_1.default.string().min(1).max(200).optional(),
        eventType: joi_1.default.string().valid('WEDDING', 'CORPORATE', 'BIRTHDAY', 'ANNIVERSARY', 'CONFERENCE', 'SEMINAR', 'PARTY', 'MEETING', 'OTHER').optional(),
        eventDate: joi_1.default.date().iso().min('now').optional(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
        guestCount: joi_1.default.number().integer().min(1).max(10000).optional(),
        lineItems: joi_1.default.array().items(joi_1.default.object({
            itemType: joi_1.default.string().valid('HALL_RENTAL', 'CHAIR', 'TABLE', 'DECORATION', 'LIGHTING', 'AV_EQUIPMENT', 'CATERING', 'SECURITY', 'GENERATOR', 'CLEANING', 'PARKING', 'OTHER').required(),
            itemName: joi_1.default.string().min(1).max(100).required(),
            description: joi_1.default.string().max(200).optional(),
            quantity: joi_1.default.number().integer().min(1).required(),
            unitPrice: joi_1.default.number().positive().required(),
            specifications: joi_1.default.object().optional(),
        })).optional(),
        validUntil: joi_1.default.date().iso().min('now').optional(),
        status: joi_1.default.string().valid('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED').optional(),
    }),
    createLineItem: joi_1.default.object({
        itemType: joi_1.default.string().valid('HALL_RENTAL', 'CHAIR', 'TABLE', 'DECORATION', 'LIGHTING', 'AV_EQUIPMENT', 'CATERING', 'SECURITY', 'GENERATOR', 'CLEANING', 'PARKING', 'OTHER').required(),
        itemName: joi_1.default.string().min(1).max(100).required(),
        description: joi_1.default.string().max(200).optional(),
        quantity: joi_1.default.number().integer().min(1).required(),
        unitPrice: joi_1.default.number().positive().required(),
        specifications: joi_1.default.object().optional(),
    }),
    createPayment: joi_1.default.object({
        bookingId: joi_1.default.string().uuid().required(),
        amount: joi_1.default.number().positive().required(),
        paymentType: joi_1.default.string().valid('DEPOSIT', 'ADVANCE', 'FULL_PAYMENT', 'REFUND').required(),
        paymentMode: joi_1.default.string().valid('CASH', 'CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CHEQUE', 'BANK_TRANSFER').required(),
        transactionId: joi_1.default.string().max(100).optional(),
        reference: joi_1.default.string().max(100).optional(),
    }),
    createAvailability: joi_1.default.object({
        hallId: joi_1.default.string().uuid().required(),
        date: joi_1.default.date().iso().min('now').required(),
        startTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: joi_1.default.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        isAvailable: joi_1.default.boolean().required(),
        reason: joi_1.default.string().max(200).optional(),
    }),
};
exports.default = ValidationMiddleware;
//# sourceMappingURL=ValidationMiddleware.js.map