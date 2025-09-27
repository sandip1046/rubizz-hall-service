import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';

export class ValidationMiddleware {
  /**
   * Validate request body against Joi schema
   */
  public static validateBody(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
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

        logger.warn('Validation error', {
          errors: errorDetails,
          url: req.url,
          method: req.method,
          userId: req.user?.id,
        });

        const response: ApiResponse = {
          success: false,
          message: 'Validation failed',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };

        (response as any).errors = errorDetails;
        res.status(400).json(response);
        return;
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    };
  }

  /**
   * Validate request query parameters against Joi schema
   */
  public static validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
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

        logger.warn('Query validation error', {
          errors: errorDetails,
          url: req.url,
          method: req.method,
          userId: req.user?.id,
        });

        const response: ApiResponse = {
          success: false,
          message: 'Query validation failed',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };

        (response as any).errors = errorDetails;
        res.status(400).json(response);
        return;
      }

      // Replace request query with validated and sanitized data
      req.query = value;
      next();
    };
  }

  /**
   * Validate request parameters against Joi schema
   */
  public static validateParams(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
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

        logger.warn('Params validation error', {
          errors: errorDetails,
          url: req.url,
          method: req.method,
          userId: req.user?.id,
        });

        const response: ApiResponse = {
          success: false,
          message: 'Parameter validation failed',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };

        (response as any).errors = errorDetails;
        res.status(400).json(response);
        return;
      }

      // Replace request params with validated and sanitized data
      req.params = value;
      next();
    };
  }

  /**
   * Validate file upload
   */
  public static validateFile(options: {
    maxSize?: number;
    allowedTypes?: string[];
    required?: boolean;
  } = {}) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;
      const file = req.file;

      if (required && !file) {
        const response: ApiResponse = {
          success: false,
          message: 'File is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }

      if (file) {
        // Check file size
        if (file.size > maxSize) {
          const response: ApiResponse = {
            success: false,
            message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          };
          res.status(400).json(response);
          return;
        }

        // Check file type
        if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
          const response: ApiResponse = {
            success: false,
            message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          };
          res.status(400).json(response);
          return;
        }
      }

      next();
    };
  }

  /**
   * Validate pagination parameters
   */
  public static validatePagination = ValidationMiddleware.validateQuery(
    Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().valid(
        'createdAt',
        'updatedAt',
        'name',
        'capacity',
        'baseRate',
        'eventDate',
        'totalAmount'
      ).default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    })
  );

  /**
   * Validate UUID parameter
   */
  public static validateUuid(field: string = 'id') {
    return ValidationMiddleware.validateParams(
      Joi.object({
        [field]: Joi.string().uuid().required(),
      })
    );
  }

  /**
   * Validate date range
   */
  public static validateDateRange = ValidationMiddleware.validateQuery(
    Joi.object({
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    })
  );

  /**
   * Validate search filters
   */
  public static validateSearchFilters = ValidationMiddleware.validateQuery(
    Joi.object({
      search: Joi.string().min(1).max(100).optional(),
      status: Joi.string().valid(
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW'
      ).optional(),
      eventType: Joi.string().valid(
        'WEDDING',
        'CORPORATE',
        'BIRTHDAY',
        'ANNIVERSARY',
        'CONFERENCE',
        'SEMINAR',
        'PARTY',
        'MEETING',
        'OTHER'
      ).optional(),
      paymentStatus: Joi.string().valid(
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'REFUNDED',
        'PARTIALLY_REFUNDED'
      ).optional(),
      isConfirmed: Joi.boolean().optional(),
      isCancelled: Joi.boolean().optional(),
    })
  );
}

// Common validation schemas
export const ValidationSchemas = {
  // Hall schemas
  createHall: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    capacity: Joi.number().integer().min(1).max(10000).required(),
    area: Joi.number().positive().optional(),
    location: Joi.string().min(1).max(200).required(),
    floor: Joi.string().max(50).optional(),
    amenities: Joi.array().items(Joi.string().max(50)).optional().default([]),
    baseRate: Joi.number().positive().required(),
    hourlyRate: Joi.number().positive().optional(),
    dailyRate: Joi.number().positive().optional(),
    weekendRate: Joi.number().positive().optional(),
    images: Joi.array().items(Joi.string().uri()).optional().default([]),
    floorPlan: Joi.string().uri().optional(),
  }),

  updateHall: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
    capacity: Joi.number().integer().min(1).max(10000).optional(),
    area: Joi.number().positive().optional(),
    location: Joi.string().min(1).max(200).optional(),
    floor: Joi.string().max(50).optional(),
    amenities: Joi.array().items(Joi.string().max(50)).optional(),
    baseRate: Joi.number().positive().optional(),
    hourlyRate: Joi.number().positive().optional(),
    dailyRate: Joi.number().positive().optional(),
    weekendRate: Joi.number().positive().optional(),
    isActive: Joi.boolean().optional(),
    isAvailable: Joi.boolean().optional(),
    images: Joi.array().items(Joi.string().uri()).optional(),
    floorPlan: Joi.string().uri().optional(),
  }),

  // Booking schemas
  createBooking: Joi.object({
    hallId: Joi.string().uuid().required(),
    customerId: Joi.string().uuid().required(),
    eventName: Joi.string().min(1).max(200).required(),
    eventType: Joi.string().valid(
      'WEDDING',
      'CORPORATE',
      'BIRTHDAY',
      'ANNIVERSARY',
      'CONFERENCE',
      'SEMINAR',
      'PARTY',
      'MEETING',
      'OTHER'
    ).required(),
    startDate: Joi.date().iso().min('now').required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    guestCount: Joi.number().integer().min(1).max(10000).required(),
    specialRequests: Joi.string().max(1000).optional(),
    quotationId: Joi.string().uuid().optional(),
  }),

  updateBooking: Joi.object({
    eventName: Joi.string().min(1).max(200).optional(),
    eventType: Joi.string().valid(
      'WEDDING',
      'CORPORATE',
      'BIRTHDAY',
      'ANNIVERSARY',
      'CONFERENCE',
      'SEMINAR',
      'PARTY',
      'MEETING',
      'OTHER'
    ).optional(),
    startDate: Joi.date().iso().min('now').optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    guestCount: Joi.number().integer().min(1).max(10000).optional(),
    specialRequests: Joi.string().max(1000).optional(),
    status: Joi.string().valid(
      'PENDING',
      'CONFIRMED',
      'CHECKED_IN',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW'
    ).optional(),
    cancellationReason: Joi.string().max(500).optional(),
  }),

  // Quotation schemas
  createQuotation: Joi.object({
    hallId: Joi.string().uuid().required(),
    customerId: Joi.string().uuid().required(),
    eventName: Joi.string().min(1).max(200).required(),
    eventType: Joi.string().valid(
      'WEDDING',
      'CORPORATE',
      'BIRTHDAY',
      'ANNIVERSARY',
      'CONFERENCE',
      'SEMINAR',
      'PARTY',
      'MEETING',
      'OTHER'
    ).required(),
    eventDate: Joi.date().iso().min('now').required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    guestCount: Joi.number().integer().min(1).max(10000).required(),
    lineItems: Joi.array().items(
      Joi.object({
        itemType: Joi.string().valid(
          'HALL_RENTAL',
          'CHAIR',
          'TABLE',
          'DECORATION',
          'LIGHTING',
          'AV_EQUIPMENT',
          'CATERING',
          'SECURITY',
          'GENERATOR',
          'CLEANING',
          'PARKING',
          'OTHER'
        ).required(),
        itemName: Joi.string().min(1).max(100).required(),
        description: Joi.string().max(200).optional(),
        quantity: Joi.number().integer().min(1).required(),
        unitPrice: Joi.number().positive().required(),
        specifications: Joi.object().optional(),
      })
    ).min(1).required(),
    validUntil: Joi.date().iso().min('now').optional(),
  }),

  // Line item schemas
  createLineItem: Joi.object({
    itemType: Joi.string().valid(
      'HALL_RENTAL',
      'CHAIR',
      'TABLE',
      'DECORATION',
      'LIGHTING',
      'AV_EQUIPMENT',
      'CATERING',
      'SECURITY',
      'GENERATOR',
      'CLEANING',
      'PARKING',
      'OTHER'
    ).required(),
    itemName: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(200).optional(),
    quantity: Joi.number().integer().min(1).required(),
    unitPrice: Joi.number().positive().required(),
    specifications: Joi.object().optional(),
  }),

  // Payment schemas
  createPayment: Joi.object({
    bookingId: Joi.string().uuid().required(),
    amount: Joi.number().positive().required(),
    paymentType: Joi.string().valid(
      'DEPOSIT',
      'ADVANCE',
      'FULL_PAYMENT',
      'REFUND'
    ).required(),
    paymentMode: Joi.string().valid(
      'CASH',
      'CARD',
      'UPI',
      'NET_BANKING',
      'WALLET',
      'CHEQUE',
      'BANK_TRANSFER'
    ).required(),
    transactionId: Joi.string().max(100).optional(),
    reference: Joi.string().max(100).optional(),
  }),

  // Availability schemas
  createAvailability: Joi.object({
    hallId: Joi.string().uuid().required(),
    date: Joi.date().iso().min('now').required(),
    startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    isAvailable: Joi.boolean().required(),
    reason: Joi.string().max(200).optional(),
  }),
};

export default ValidationMiddleware;
