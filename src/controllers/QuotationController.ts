import { Request, Response, NextFunction } from 'express';
import { QuotationService } from '@/services/QuotationService';
import { logger } from '@/utils/logger';
import { ApiResponse, EventType, QuotationStatus } from '@/types';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { ValidationMiddleware, ValidationSchemas } from '@/middleware/ValidationMiddleware';
import { AuthMiddleware } from '@/middleware/AuthMiddleware';
import { RateLimitMiddleware } from '@/middleware/RateLimitMiddleware';

export class QuotationController {
  private quotationService: QuotationService;

  constructor() {
    this.quotationService = new QuotationService();
  }

  /**
   * Create a new quotation
   */
  public createQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const quotation = await this.quotationService.createQuotation(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation created successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get quotation by ID
   */
  public getQuotationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.getQuotationById(id);

      if (!quotation) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Quotation retrieved successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get quotation by quotation number
   */
  public getQuotationByNumber = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { quotationNumber } = req.params;
      if (!quotationNumber) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation number is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.getQuotationByNumber(quotationNumber);

      if (!quotation) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Quotation retrieved successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get quotations with filters and pagination
   */
  public getQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        ...(req.query.hallId && { hallId: req.query.hallId as string }),
        ...(req.query.customerId && { customerId: req.query.customerId as string }),
        ...(req.query.eventType && { eventType: req.query.eventType as EventType }),
        ...(req.query.status && { status: req.query.status as QuotationStatus }),
        ...(req.query.isAccepted !== undefined && { isAccepted: req.query.isAccepted === 'true' }),
        ...(req.query.isExpired !== undefined && { isExpired: req.query.isExpired === 'true' }),
        ...(req.query.eventDate && { eventDate: req.query.eventDate as string }),
        ...(req.query.validUntil && { validUntil: req.query.validUntil as string }),
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.quotationService.getQuotations(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Quotations retrieved successfully',
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      // Add pagination metadata to response
      (response as any).pagination = result.pagination;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update quotation
   */
  public updateQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.updateQuotation(id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation updated successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Accept quotation
   */
  public acceptQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.acceptQuotation(id);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation accepted successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject quotation
   */
  public rejectQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.rejectQuotation(id);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation rejected successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Expire quotation
   */
  public expireQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.expireQuotation(id);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation expired successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send quotation
   */
  public sendQuotation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Quotation ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const quotation = await this.quotationService.sendQuotation(id);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation sent successfully',
        data: quotation,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Calculate quotation cost
   */
  public calculateCost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const costResult = await this.quotationService.calculateQuotationCost(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Cost calculated successfully',
        data: costResult,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get quotation statistics
   */
  public getQuotationStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        hallId: req.query.hallId as string,
        customerId: req.query.customerId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const statistics = await this.quotationService.getQuotationStatistics(filters);

      const response: ApiResponse = {
        success: true,
        message: 'Quotation statistics retrieved successfully',
        data: statistics,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer quotations
   */
  public getCustomerQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = req.user?.id;
      
      if (!customerId) {
        const response: ApiResponse = {
          success: false,
          message: 'Customer ID not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(401).json(response);
        return;
      }

      const filters = {
        customerId,
        ...req.query,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.quotationService.getQuotations(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Customer quotations retrieved successfully',
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      // Add pagination metadata to response
      (response as any).pagination = result.pagination;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get hall quotations
   */
  public getHallQuotations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { hallId } = req.params;
      if (!hallId) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }

      const filters = {
        hallId,
        ...req.query,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.quotationService.getQuotations(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Hall quotations retrieved successfully',
        data: result.data,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      // Add pagination metadata to response
      (response as any).pagination = result.pagination;

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Setup routes
   */
  public static routes() {
    const controller = new QuotationController();
    const express = require('express');
    const router = express.Router();

    // Apply rate limiting
    router.use(RateLimitMiddleware.general);

    // Calculate cost (Public with optional auth)
    router.post(
      '/calculate',
      AuthMiddleware.optionalAuth,
      ErrorHandler.asyncHandler(controller.calculateCost)
    );

    // Create quotation (Admin/Manager)
    router.post(
      '/',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateBody(ValidationSchemas.createQuotation),
      ErrorHandler.asyncHandler(controller.createQuotation)
    );

    // Get quotations (Admin/Manager/Staff)
    router.get(
      '/',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getQuotations)
    );

    // Get customer quotations (Customer)
    router.get(
      '/my-quotations',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireCustomer,
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getCustomerQuotations)
    );

    // Get hall quotations (Admin/Manager/Staff)
    router.get(
      '/hall/:hallId',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('hallId'),
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getHallQuotations)
    );

    // Get quotation statistics (Admin/Manager)
    router.get(
      '/statistics',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ErrorHandler.asyncHandler(controller.getQuotationStatistics)
    );

    // Get quotation by ID (Customer/Admin/Manager/Staff)
    router.get(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.getQuotationById)
    );

    // Get quotation by number (Public)
    router.get(
      '/number/:quotationNumber',
      ErrorHandler.asyncHandler(controller.getQuotationByNumber)
    );

    // Update quotation (Admin/Manager)
    router.put(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ValidationMiddleware.validateBody(ValidationSchemas.updateQuotation),
      ErrorHandler.asyncHandler(controller.updateQuotation)
    );

    // Send quotation (Admin/Manager)
    router.post(
      '/:id/send',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.sendQuotation)
    );

    // Accept quotation (Customer/Admin/Manager)
    router.post(
      '/:id/accept',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.acceptQuotation)
    );

    // Reject quotation (Customer/Admin/Manager)
    router.post(
      '/:id/reject',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.rejectQuotation)
    );

    // Expire quotation (Admin/Manager)
    router.post(
      '/:id/expire',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.expireQuotation)
    );

    return router;
  }
}

export default QuotationController;
