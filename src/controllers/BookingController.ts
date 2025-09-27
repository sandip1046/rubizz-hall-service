import { Request, Response, NextFunction } from 'express';
import { BookingService } from '@/services/BookingService';
import { logger } from '@/utils/logger';
import { ApiResponse } from '@/types';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { ValidationMiddleware, ValidationSchemas } from '@/middleware/ValidationMiddleware';
import { AuthMiddleware } from '@/middleware/AuthMiddleware';
import { RateLimitMiddleware } from '@/middleware/RateLimitMiddleware';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  /**
   * Create a new booking
   */
  public createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const booking = await this.bookingService.createBooking(req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Booking created successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get booking by ID
   */
  public getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.getBookingById(id);

      if (!booking) {
        const response: ApiResponse = {
          success: false,
          message: 'Booking not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'Booking retrieved successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get bookings with filters and pagination
   */
  public getBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        hallId: req.query.hallId as string,
        customerId: req.query.customerId as string,
        eventType: req.query.eventType as string,
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        isConfirmed: req.query.isConfirmed ? req.query.isConfirmed === 'true' : undefined,
        isCancelled: req.query.isCancelled ? req.query.isCancelled === 'true' : undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await this.bookingService.getBookings(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Bookings retrieved successfully',
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
   * Update booking
   */
  public updateBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.updateBooking(id, req.body);

      const response: ApiResponse = {
        success: true,
        message: 'Booking updated successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel booking
   */
  public cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        const response: ApiResponse = {
          success: false,
          message: 'Cancellation reason is required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        };
        res.status(400).json(response);
        return;
      }

      const booking = await this.bookingService.cancelBooking(id, reason);

      const response: ApiResponse = {
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirm booking
   */
  public confirmBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.confirmBooking(id);

      const response: ApiResponse = {
        success: true,
        message: 'Booking confirmed successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check-in booking
   */
  public checkInBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.checkInBooking(id);

      const response: ApiResponse = {
        success: true,
        message: 'Booking checked in successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check-out booking
   */
  public checkOutBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const booking = await this.bookingService.checkOutBooking(id);

      const response: ApiResponse = {
        success: true,
        message: 'Booking checked out successfully',
        data: booking,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get booking statistics
   */
  public getBookingStatistics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = {
        hallId: req.query.hallId as string,
        customerId: req.query.customerId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const statistics = await this.bookingService.getBookingStatistics(filters);

      const response: ApiResponse = {
        success: true,
        message: 'Booking statistics retrieved successfully',
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
   * Get customer bookings
   */
  public getCustomerBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const result = await this.bookingService.getBookings(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Customer bookings retrieved successfully',
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
   * Get hall bookings
   */
  public getHallBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { hallId } = req.params;

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

      const result = await this.bookingService.getBookings(filters, pagination);

      const response: ApiResponse = {
        success: true,
        message: 'Hall bookings retrieved successfully',
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
    const controller = new BookingController();
    const express = require('express');
    const router = express.Router();

    // Apply rate limiting
    router.use(RateLimitMiddleware.general);

    // Create booking (Customer/Admin)
    router.post(
      '/',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager']),
      ValidationMiddleware.validateBody(ValidationSchemas.createBooking),
      ErrorHandler.asyncHandler(controller.createBooking)
    );

    // Get bookings (Admin/Manager/Staff)
    router.get(
      '/',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validateSearchFilters,
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getBookings)
    );

    // Get customer bookings (Customer)
    router.get(
      '/my-bookings',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireCustomer,
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getCustomerBookings)
    );

    // Get hall bookings (Admin/Manager/Staff)
    router.get(
      '/hall/:hallId',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('hallId'),
      ValidationMiddleware.validatePagination,
      ErrorHandler.asyncHandler(controller.getHallBookings)
    );

    // Get booking statistics (Admin/Manager)
    router.get(
      '/statistics',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ErrorHandler.asyncHandler(controller.getBookingStatistics)
    );

    // Get booking by ID (Customer/Admin/Manager/Staff)
    router.get(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.getBookingById)
    );

    // Update booking (Admin/Manager)
    router.put(
      '/:id',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ValidationMiddleware.validateBody(ValidationSchemas.updateBooking),
      ErrorHandler.asyncHandler(controller.updateBooking)
    );

    // Cancel booking (Customer/Admin/Manager)
    router.post(
      '/:id/cancel',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['customer', 'admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.cancelBooking)
    );

    // Confirm booking (Admin/Manager)
    router.post(
      '/:id/confirm',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.confirmBooking)
    );

    // Check-in booking (Admin/Manager/Staff)
    router.post(
      '/:id/checkin',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.checkInBooking)
    );

    // Check-out booking (Admin/Manager/Staff)
    router.post(
      '/:id/checkout',
      AuthMiddleware.verifyToken,
      AuthMiddleware.requireRole(['admin', 'manager', 'staff']),
      ValidationMiddleware.validateUuid('id'),
      ErrorHandler.asyncHandler(controller.checkOutBooking)
    );

    return router;
  }
}

export default BookingController;
