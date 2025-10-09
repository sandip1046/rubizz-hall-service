import { Request, Response, NextFunction } from 'express';
import { HallService } from '@/services/HallService';
import { logger } from '@/utils/logger';
import { ApiResponse, EventType } from '@/types';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { ValidationMiddleware, ValidationSchemas } from '@/middleware/ValidationMiddleware';
import { AuthMiddleware } from '@/middleware/AuthMiddleware';
import { RateLimitMiddleware } from '@/middleware/RateLimitMiddleware';

export class HallController {
  private hallService: HallService;

  constructor() {
    this.hallService = new HallService();
  }

  /**
   * Create a new hall
   */
  public createHall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hall = await this.hallService.createHall(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Hall created successfully',
        data: hall,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get hall by ID
   */
  public getHallById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const hall = await this.hallService.getHallById(id);

      if (!hall) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Hall retrieved successfully',
        data: hall,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get halls with filters and pagination
   */
  public getHalls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        ...(req.query.location && { location: req.query.location as string }),
        ...(req.query.capacity && { capacity: parseInt(req.query.capacity as string) }),
        ...(req.query.minCapacity && { minCapacity: parseInt(req.query.minCapacity as string) }),
        ...(req.query.maxCapacity && { maxCapacity: parseInt(req.query.maxCapacity as string) }),
        ...(req.query.eventType && { eventType: req.query.eventType as EventType }),
        ...(req.query.date && { date: req.query.date as string }),
        ...(req.query.startTime && { startTime: req.query.startTime as string }),
        ...(req.query.endTime && { endTime: req.query.endTime as string }),
        ...(req.query.amenities && { amenities: (req.query.amenities as string).split(',') }),
        ...(req.query.minRate && { minRate: parseFloat(req.query.minRate as string) }),
        ...(req.query.maxRate && { maxRate: parseFloat(req.query.maxRate as string) }),
        ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
        ...(req.query.isAvailable !== undefined && { isAvailable: req.query.isAvailable === 'true' }),
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.hallService.getHalls(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Halls retrieved successfully',
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
   * Update hall
   */
  public updateHall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const hall = await this.hallService.updateHall(id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Hall updated successfully',
        data: hall,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete hall
   */
  public deleteHall = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const deleted = await this.hallService.deleteHall(id);

      if (!deleted) {
        const response: ApiResponse = {
          success: false,
          message: 'Failed to delete hall',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(500).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Hall deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check hall availability
   */
  public checkAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const { date, startTime, endTime } = req.query;

      if (!date || !startTime || !endTime) {
        const response: ApiResponse = {
          success: false,
          message: 'Date, startTime, and endTime are required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }

      const isAvailable = await this.hallService.checkHallAvailability(
        id,
        date as string,
        startTime as string,
        endTime as string
      );

      const response: ApiResponse = {
        success: true,
        message: 'Availability checked successfully',
        data: {
          hallId: id,
          date,
          startTime,
          endTime,
          isAvailable,
        },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get hall with relations
   */
  public getHallWithRelations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const hall = await this.hallService.getHallWithRelations(id);

      if (!hall) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Hall with relations retrieved successfully',
        data: hall,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search halls
   */
  public searchHalls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;

      if (!q) {
        const response: ApiResponse = {
          success: false,
          message: 'Search query is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.hallService.searchHalls(q as string, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Halls searched successfully',
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
   * Get hall statistics
   */
  public getHallStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse = {
          success: false,
          message: 'Hall ID is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }
      const statistics = await this.hallService.getHallStatistics(id);

      const response: ApiResponse = {
        success: true,
        message: 'Hall statistics retrieved successfully',
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
   * Setup routes
   */
  public static routes() {
    const controller = new HallController();
    const express = require('express');
    const router = express.Router();

    // Apply rate limiting
    router.use(RateLimitMiddleware.general);

    // Create hall (Admin only)
    router.post(
      '/',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireAdmin,
      ValidationMiddleware.validateBody(ValidationSchemas.createHall),
      ErrorHandler.asyncHandler(controller.createHall)
    );

    // Get halls (Public with optional auth)
    router.get(
      '/',
      AuthMiddleware.optionalAuth,
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getHalls)
    );

    // Search halls (Public)
    router.get(
      '/search',
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.searchHalls)
    );

    // Get hall by ID (Public with optional auth)
    router.get(
      '/:id',
      AuthMiddleware.optionalAuth,
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.getHallById)
    );

    // Get hall with relations (Admin/Manager only)
    router.get(
      '/:id/relations',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.getHallWithRelations)
    );

    // Check hall availability (Public)
    router.get(
      '/:id/availability',
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.checkAvailability)
    );

    // Get hall statistics (Admin/Manager only)
    router.get(
      '/:id/statistics',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.getHallStatistics)
    );

    // Update hall (Admin only)
    router.put(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireAdmin,
      ValidationMiddleware.validateUuid('id'),
      ValidationMiddleware.validateBody(ValidationSchemas.updateHall),
      ErrorHandler.asyncHandler(controller.updateHall)
    );

    // Delete hall (Admin only)
    router.delete(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireAdmin,
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.deleteHall)
    );

    return router;
  }
}

export default HallController;
