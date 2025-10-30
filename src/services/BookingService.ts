import mongoose from 'mongoose';
import { RedisService } from '@/services/RedisService';
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
import HallModel from '@/models/Hall';
import HallBookingModel from '@/models/HallBooking';

export class BookingService {
  private hallService: HallService;
  private redisService: RedisService;

  constructor() {
    this.hallService = new HallService();
    this.redisService = new RedisService();
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
      const hall = await HallModel.findById(data.hallId).lean();

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
      const createdDoc = await HallBookingModel.create({
        hallId: data.hallId,
        customerId: data.customerId,
        customerName: '',
        customerEmail: '',
        customerPhone: '',
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
        discount: 0,
        taxAmount,
        totalAmount,
        depositAmount: CostCalculator.calculateDepositAmount(totalAmount),
        balanceAmount: totalAmount - CostCalculator.calculateDepositAmount(totalAmount),
        depositPaid: false,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
      });
      const booking = await HallBookingModel.findById((createdDoc as any)._id).lean<HallBooking>();
      if (!booking) {
        throw ErrorHandler.createError('Failed to create booking', 500, 'InternalServerError');
      }

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check cache first
      const cacheKey = `booking:${id}`;
      const cachedBooking = await this.redisService.getCache(cacheKey);
      
      if (cachedBooking) {
        return cachedBooking;
      }

      // Fetch from database
      const booking = await HallBookingModel.findById(id).lean<HallBooking>();

      if (booking) {
        // Cache for 30 minutes
        await this.redisService.setCache(cacheKey, booking, 1800);
      }

      return booking as HallBooking | null;
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
      const sort: any = {};
      if (pagination?.sortBy) {
        sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1;
      }

      // Execute query
      const [bookings, total] = await Promise.all([
        HallBookingModel.find(where).skip(skip).limit(limit).sort(sort).lean<HallBooking[]>(),
        HallBookingModel.countDocuments(where),
      ]);

      // Generate pagination metadata
      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {
        data: bookings as HallBooking[],
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Validate input data
      const validation = Validators.validateUpdateBooking(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Check if booking exists
      const existingBooking = await HallBookingModel.findById(id).lean();

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
          String(existingBooking.hallId),
          startDate!,
          startTime,
          endTime
        );

        if (!isAvailable) {
          throw ErrorHandler.Conflict('Hall is not available for the selected date and time');
        }
      }

      // Update booking
      await HallBookingModel.updateOne({ _id: id }, Helpers.removeUndefinedValues(data));
      const updatedBooking = await HallBookingModel.findById(id).lean<HallBooking>();

      // Clear cache
      await this.clearBookingCache();
      await this.redisService.deleteCache(`booking:${id}`);

      logger.info('Booking updated successfully', { bookingId: id });

      return updatedBooking as HallBooking;
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await HallBookingModel.findById(id).lean();

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
        24, // cancellationHours - assuming 24 hours notice
        existingBooking.startDate
      );

      // Update booking
      await HallBookingModel.updateOne({ _id: id }, {
        isCancelled: true,
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      });
      const updatedBooking = await HallBookingModel.findById(id).lean<HallBooking>();

      // Clear cache
      await this.clearBookingCache();
      await this.redisService.deleteCache(`booking:${id}`);

      logger.info('Booking cancelled successfully', { 
        bookingId: id, 
        refundAmount,
        reason 
      });

      return updatedBooking as HallBooking;
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await HallBookingModel.findById(id).lean();

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
      await HallBookingModel.updateOne({ _id: id }, {
        isConfirmed: true,
        status: BookingStatus.CONFIRMED,
        confirmedAt: new Date(),
      });
      const updatedBooking = await HallBookingModel.findById(id).lean<HallBooking>();

      // Clear cache
      await this.clearBookingCache();
      await this.redisService.deleteCache(`booking:${id}`);

      logger.info('Booking confirmed successfully', { bookingId: id });

      return updatedBooking as HallBooking;
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await HallBookingModel.findById(id).lean();

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
      await HallBookingModel.updateOne({ _id: id }, { status: BookingStatus.CHECKED_IN });
      const updatedBooking = await HallBookingModel.findById(id).lean<HallBooking>();

      // Clear cache
      await this.clearBookingCache();
      await this.redisService.deleteCache(`booking:${id}`);

      logger.info('Booking checked in successfully', { bookingId: id });

      return updatedBooking as HallBooking;
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid booking ID format');
      }

      // Check if booking exists
      const existingBooking = await HallBookingModel.findById(id).lean();

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
      await HallBookingModel.updateOne({ _id: id }, { status: BookingStatus.COMPLETED });
      const updatedBooking = await HallBookingModel.findById(id).lean<HallBooking>();

      // Clear cache
      await this.clearBookingCache();
      await this.redisService.deleteCache(`booking:${id}`);

      logger.info('Booking checked out successfully', { bookingId: id });

      return updatedBooking as HallBooking;
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
        totalRevenueAgg,
        averageBookingAgg,
      ] = await Promise.all([
        HallBookingModel.countDocuments(where),
        HallBookingModel.countDocuments({ ...where, isConfirmed: true }),
        HallBookingModel.countDocuments({ ...where, status: BookingStatus.COMPLETED }),
        HallBookingModel.countDocuments({ ...where, isCancelled: true }),
        HallBookingModel.aggregate([
          { $match: { ...where, status: BookingStatus.COMPLETED } },
          { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
        ]),
        HallBookingModel.aggregate([
          { $match: { ...where, status: BookingStatus.COMPLETED } },
          { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } },
        ]),
      ]);

      return {
        totalBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: (totalRevenueAgg[0]?.totalAmount as number) || 0,
        averageBookingValue: (averageBookingAgg[0]?.avgAmount as number) || 0,
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
      // Note: Pattern-based key deletion is not directly supported by RedisService
      // We'll need to implement this differently or use a different approach
      // For now, we'll skip this functionality as it's not critical
      logger.info('Booking cache clear requested - pattern-based deletion not supported in RedisService');
    } catch (error) {
      logger.error('Failed to clear booking cache:', error);
    }
  }
}

export default BookingService;
