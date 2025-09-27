import { PrismaClient } from '@prisma/client';
import { database } from '@/database/DatabaseConnection';
import { redis } from '@/database/RedisConnection';
import { logger } from '@/utils/logger';
import { 
  HallBooking, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  BookingSearchFilters, 
  PaginationParams, 
  PaginatedResponse,
  BookingWithRelations,
  BookingStatus,
  PaymentStatus
} from '@/types';
import { Validators } from '@/utils/validators';
import { Helpers } from '@/utils/helpers';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { CostCalculator } from '@/utils/costCalculator';
import { HallService } from './HallService';

export class BookingService {
  private prisma: PrismaClient;
  private hallService: HallService;

  constructor() {
    this.prisma = database.getPrisma();
    this.hallService = new HallService();
  }

  /**
   * Create a new booking
   */
  public async createBooking(data: CreateBookingRequest): Promise<HallBooking> {
    try {
      // Validate input data
      const validation = Validators.validateCreateBooking(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Check if hall exists and is available
      const isAvailable = await this.hallService.checkHallAvailability(
        data.hallId,
        data.startDate,
        data.startTime,
        data.endTime
      );

      if (!isAvailable) {
        throw ErrorHandler.Conflict('Hall is not available for the selected date and time');
      }

      // Get hall details for pricing
      const hall = await this.prisma.hall.findUnique({
        where: { id: data.hallId },
      });

      if (!hall) {
        throw ErrorHandler.NotFound('Hall not found');
      }

      // Calculate duration
      const duration = Helpers.getTimeDifferenceInHours(data.startTime, data.endTime);

      // Calculate base amount
      const baseAmount = this.calculateBaseAmount(hall, data.startDate, duration);

      // Calculate additional charges
      const additionalCharges = 0; // Will be calculated from line items if quotation is provided

      // Calculate tax
      const taxAmount = ((baseAmount + additionalCharges) * 18) / 100; // 18% tax

      // Calculate total amount
      const totalAmount = baseAmount + additionalCharges + taxAmount;

      // Create booking
      const booking = await this.prisma.hallBooking.create({
        data: {
          hallId: data.hallId,
          customerId: data.customerId,
          eventName: data.eventName,
          eventType: data.eventType,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          startTime: data.startTime,
          endTime: data.endTime,
          duration: Math.round(duration),
          guestCount: data.guestCount,
          specialRequests: data.specialRequests,
          baseAmount,
          additionalCharges,
          taxAmount,
          totalAmount,
          depositAmount: CostCalculator.calculateDepositAmount(totalAmount),
          status: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      // Clear cache
      await this.clearBookingCache();

      logger.info('Booking created successfully', { 
        bookingId: booking.id, 
        hallId: booking.hallId,
        customerId: booking.customerId 
      });

      return booking;
    } catch (error) {
      logger.error('Failed to create booking:', error);
      throw error;
    }
  }

  /**
   * Get booking by ID
   */
  public async getBookingById(id: string): Promise<HallBooking | null> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check cache first
      const cacheKey = `booking:${id}`;
      const cachedBooking = await redis.get(cacheKey);
      
      if (cachedBooking) {
        return JSON.parse(cachedBooking);
      }

      // Fetch from database
      const booking = await this.prisma.hallBooking.findUnique({
        where: { id },
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      if (booking) {
        // Cache for 30 minutes
        await redis.set(cacheKey, JSON.stringify(booking), 1800);
      }

      return booking;
    } catch (error) {
      logger.error('Failed to get booking by ID:', error);
      throw error;
    }
  }

  /**
   * Get bookings with filters and pagination
   */
  public async getBookings(
    filters?: BookingSearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<HallBooking>> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (filters?.hallId) {
        where.hallId = filters.hallId;
      }

      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.paymentStatus) {
        where.paymentStatus = filters.paymentStatus;
      }

      if (filters?.startDate) {
        where.startDate = {
          gte: new Date(filters.startDate),
        };
      }

      if (filters?.endDate) {
        where.endDate = {
          lte: new Date(filters.endDate),
        };
      }

      if (filters?.isConfirmed !== undefined) {
        where.isConfirmed = filters.isConfirmed;
      }

      if (filters?.isCancelled !== undefined) {
        where.isCancelled = filters.isCancelled;
      }

      // Build order by clause
      const orderBy: any = {};
      if (pagination?.sortBy) {
        orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Execute query
      const [bookings, total] = await Promise.all([
        this.prisma.hallBooking.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            hall: {
              select: {
                id: true,
                name: true,
                location: true,
              },
            },
          },
        }),
        this.prisma.hallBooking.count({ where }),
      ]);

      // Generate pagination metadata
      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {
        data: bookings,
        pagination: paginationMeta,
      };
    } catch (error) {
      logger.error('Failed to get bookings:', error);
      throw error;
    }
  }

  /**
   * Update booking
   */
  public async updateBooking(id: string, data: UpdateBookingRequest): Promise<HallBooking> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Validate input data
      const validation = Validators.validateUpdateBooking(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Check if booking exists
      const existingBooking = await this.prisma.hallBooking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        throw ErrorHandler.NotFound('Booking not found');
      }

      // Check if booking can be updated
      if (existingBooking.isCancelled) {
        throw ErrorHandler.Conflict('Cannot update cancelled booking');
      }

      if (existingBooking.status === BookingStatus.COMPLETED) {
        throw ErrorHandler.Conflict('Cannot update completed booking');
      }

      // Check availability if date/time is being changed
      if (data.startDate || data.startTime || data.endTime) {
        const startDate = data.startDate || existingBooking.startDate.toISOString().split('T')[0];
        const startTime = data.startTime || existingBooking.startTime;
        const endTime = data.endTime || existingBooking.endTime;

        const isAvailable = await this.hallService.checkHallAvailability(
          existingBooking.hallId,
          startDate,
          startTime,
          endTime
        );

        if (!isAvailable) {
          throw ErrorHandler.Conflict('Hall is not available for the selected date and time');
        }
      }

      // Update booking
      const updatedBooking = await this.prisma.hallBooking.update({
        where: { id },
        data: Helpers.removeUndefinedValues(data),
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      // Clear cache
      await this.clearBookingCache();
      await redis.del(`booking:${id}`);

      logger.info('Booking updated successfully', { bookingId: id });

      return updatedBooking;
    } catch (error) {
      logger.error('Failed to update booking:', error);
      throw error;
    }
  }

  /**
   * Cancel booking
   */
  public async cancelBooking(id: string, reason: string): Promise<HallBooking> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await this.prisma.hallBooking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        throw ErrorHandler.NotFound('Booking not found');
      }

      // Check if booking can be cancelled
      if (existingBooking.isCancelled) {
        throw ErrorHandler.Conflict('Booking is already cancelled');
      }

      if (existingBooking.status === BookingStatus.COMPLETED) {
        throw ErrorHandler.Conflict('Cannot cancel completed booking');
      }

      // Calculate refund amount
      const refundAmount = CostCalculator.calculateRefundAmount(
        existingBooking.totalAmount,
        existingBooking.totalAmount, // Assuming full amount is paid
        existingBooking.startDate
      );

      // Update booking
      const updatedBooking = await this.prisma.hallBooking.update({
        where: { id },
        data: {
          isCancelled: true,
          status: BookingStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      // Clear cache
      await this.clearBookingCache();
      await redis.del(`booking:${id}`);

      logger.info('Booking cancelled successfully', { 
        bookingId: id, 
        refundAmount,
        reason 
      });

      return updatedBooking;
    } catch (error) {
      logger.error('Failed to cancel booking:', error);
      throw error;
    }
  }

  /**
   * Confirm booking
   */
  public async confirmBooking(id: string): Promise<HallBooking> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await this.prisma.hallBooking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        throw ErrorHandler.NotFound('Booking not found');
      }

      // Check if booking can be confirmed
      if (existingBooking.isCancelled) {
        throw ErrorHandler.Conflict('Cannot confirm cancelled booking');
      }

      if (existingBooking.isConfirmed) {
        throw ErrorHandler.Conflict('Booking is already confirmed');
      }

      // Update booking
      const updatedBooking = await this.prisma.hallBooking.update({
        where: { id },
        data: {
          isConfirmed: true,
          status: BookingStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      // Clear cache
      await this.clearBookingCache();
      await redis.del(`booking:${id}`);

      logger.info('Booking confirmed successfully', { bookingId: id });

      return updatedBooking;
    } catch (error) {
      logger.error('Failed to confirm booking:', error);
      throw error;
    }
  }

  /**
   * Check-in booking
   */
  public async checkInBooking(id: string): Promise<HallBooking> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await this.prisma.hallBooking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        throw ErrorHandler.NotFound('Booking not found');
      }

      // Check if booking can be checked in
      if (existingBooking.isCancelled) {
        throw ErrorHandler.Conflict('Cannot check in cancelled booking');
      }

      if (!existingBooking.isConfirmed) {
        throw ErrorHandler.Conflict('Booking must be confirmed before check-in');
      }

      if (existingBooking.status === BookingStatus.CHECKED_IN) {
        throw ErrorHandler.Conflict('Booking is already checked in');
      }

      // Update booking
      const updatedBooking = await this.prisma.hallBooking.update({
        where: { id },
        data: {
          status: BookingStatus.CHECKED_IN,
        },
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      // Clear cache
      await this.clearBookingCache();
      await redis.del(`booking:${id}`);

      logger.info('Booking checked in successfully', { bookingId: id });

      return updatedBooking;
    } catch (error) {
      logger.error('Failed to check in booking:', error);
      throw error;
    }
  }

  /**
   * Check-out booking
   */
  public async checkOutBooking(id: string): Promise<HallBooking> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await this.prisma.hallBooking.findUnique({
        where: { id },
      });

      if (!existingBooking) {
        throw ErrorHandler.NotFound('Booking not found');
      }

      // Check if booking can be checked out
      if (existingBooking.isCancelled) {
        throw ErrorHandler.Conflict('Cannot check out cancelled booking');
      }

      if (existingBooking.status !== BookingStatus.CHECKED_IN) {
        throw ErrorHandler.Conflict('Booking must be checked in before check-out');
      }

      // Update booking
      const updatedBooking = await this.prisma.hallBooking.update({
        where: { id },
        data: {
          status: BookingStatus.COMPLETED,
        },
        include: {
          hall: true,
          quotation: true,
          lineItems: true,
          payments: true,
        },
      });

      // Clear cache
      await this.clearBookingCache();
      await redis.del(`booking:${id}`);

      logger.info('Booking checked out successfully', { bookingId: id });

      return updatedBooking;
    } catch (error) {
      logger.error('Failed to check out booking:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  public async getBookingStatistics(filters?: {
    hallId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<any> {
    try {
      const where: any = {};

      if (filters?.hallId) {
        where.hallId = filters.hallId;
      }

      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }

      if (filters?.startDate) {
        where.startDate = {
          gte: new Date(filters.startDate),
        };
      }

      if (filters?.endDate) {
        where.endDate = {
          lte: new Date(filters.endDate),
        };
      }

      const [
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingValue,
      ] = await Promise.all([
        this.prisma.hallBooking.count({ where }),
        this.prisma.hallBooking.count({
          where: { ...where, isConfirmed: true },
        }),
        this.prisma.hallBooking.count({
          where: { ...where, status: BookingStatus.COMPLETED },
        }),
        this.prisma.hallBooking.count({
          where: { ...where, isCancelled: true },
        }),
        this.prisma.hallBooking.aggregate({
          where: { ...where, status: BookingStatus.COMPLETED },
          _sum: { totalAmount: true },
        }),
        this.prisma.hallBooking.aggregate({
          where: { ...where, status: BookingStatus.COMPLETED },
          _avg: { totalAmount: true },
        }),
      ]);

      return {
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        averageBookingValue: averageBookingValue._avg.totalAmount || 0,
        confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
        completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
        cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      };
    } catch (error) {
      logger.error('Failed to get booking statistics:', error);
      throw error;
    }
  }

  /**
   * Calculate base amount for booking
   */
  private calculateBaseAmount(hall: any, startDate: string, duration: number): number {
    const eventDate = new Date(startDate);
    const isWeekend = Helpers.isWeekend(eventDate);
    
    let baseRate = hall.baseRate;
    
    // Apply weekend surcharge
    if (isWeekend && hall.weekendRate) {
      baseRate = hall.weekendRate;
    }
    
    // Calculate cost based on duration
    if (duration <= 4) {
      return baseRate; // Half day rate
    } else if (duration <= 8) {
      return baseRate * 1.5; // Full day rate
    } else {
      return baseRate * 2; // Extended day rate
    }
  }

  /**
   * Clear booking cache
   */
  private async clearBookingCache(): Promise<void> {
    try {
      const pattern = 'booking:*';
      const keys = await redis.getClient().keys(pattern);
      if (keys.length > 0) {
        await redis.getClient().del(keys);
      }
    } catch (error) {
      logger.error('Failed to clear booking cache:', error);
    }
  }
}

export default BookingService;
