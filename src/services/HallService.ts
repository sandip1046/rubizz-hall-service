import mongoose from 'mongoose';

import { RedisService } from '@/services/RedisService';

import { logger } from '@/utils/logger';

import { 
  Hall, 
  CreateHallRequest, 
  UpdateHallRequest, 
  HallSearchFilters, 
  PaginationParams, 
  PaginatedResponse,
  HallWithRelations 
} from '@/types';

import { Validators } from '@/utils/validators';

import { Helpers } from '@/utils/helpers';

import { ErrorHandler } from '@/middleware/ErrorHandler';

import HallModel from '@/models/Hall';

import HallBookingModel from '@/models/HallBooking';

import HallAvailabilityModel from '@/models/HallAvailability';

export class HallService {

  private redisService: RedisService;

  constructor() {

    this.redisService = new RedisService();

  }

  /**

   * Create a new hall

   */

  public async createHall(data: CreateHallRequest): Promise<Hall> {

    try {

      // Validate input data

      const validation = Validators.validateCreateHall(data);

      if (!validation.isValid) {

        throw ErrorHandler.BadRequest(validation.errors.join(', '));

      }

      // Check if hall with same name already exists

      const existingHall = await HallModel.findOne({ name: data.name }).lean();

      if (existingHall) {

        throw ErrorHandler.Conflict('Hall with this name already exists');

      }

      // Create hall

      const hall = await HallModel.create({

        name: data.name,

        description: data.description || null,

        capacity: data.capacity,

        area: data.area || 0,

        location: data.location,

        amenities: data.amenities || [],

        baseRate: data.baseRate,

        hourlyRate: data.hourlyRate || null,

        dailyRate: data.dailyRate || null,

        weekendRate: data.weekendRate || null,

        images: data.images || [],

        floorPlan: data.floorPlan || null,

      });

      // Clear cache

      await this.clearHallCache();

      const created = await HallModel.findById((hall as any)._id).lean<Hall>();

      logger.info('Hall created successfully', { hallId: (hall as any)._id?.toString?.(), name: created?.name });

      return created as Hall;

    } catch (error) {

      logger.error('Failed to create hall:', error);

      throw error;

    }

  }

  /**

   * Get hall by ID

   */

  public async getHallById(id: string): Promise<Hall | null> {

    try {

      // Validate ObjectId

      if (!mongoose.Types.ObjectId.isValid(id)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      // Check cache first

      const cacheKey = `hall:${id}`;

      const cachedHall = await this.redisService.getCache(cacheKey);

      

      if (cachedHall) {

        return cachedHall;

      }

      // Fetch from database

      const hall = await HallModel.findById(id).lean<Hall>();

      if (hall) {

        // Cache for 1 hour

        await this.redisService.setCache(cacheKey, hall, 3600);

      }

      return hall;

    } catch (error) {

      logger.error('Failed to get hall by ID:', error);

      throw error;

    }

  }

  /**

   * Get halls with filters and pagination

   */

  public async getHalls(

    filters?: HallSearchFilters,

    pagination?: PaginationParams

  ): Promise<PaginatedResponse<Hall>> {

    try {

      const page = pagination?.page || 1;

      const limit = pagination?.limit || 10;

      const skip = (page - 1) * limit;

      // Build where clause

      const where: any = {};

      if (filters?.location) {

        where.location = {

          contains: filters.location,

          mode: 'insensitive',

        };

      }

      if (filters?.capacity) {

        where.capacity = {

          gte: filters.capacity,

        };

      }

      if (filters?.minCapacity) {

        where.capacity = {

          ...where.capacity,

          gte: filters.minCapacity,

        };

      }

      if (filters?.maxCapacity) {

        where.capacity = {

          ...where.capacity,

          lte: filters.maxCapacity,

        };

      }

      if (filters?.amenities && filters.amenities.length > 0) {

        where.amenities = {

          hasSome: filters.amenities,

        };

      }

      if (filters?.minRate) {
        where.baseRate = {
          gte: filters.minRate,
        };
      }

      if (filters?.maxRate) {

        where.baseRate = {

          ...where.baseRate,

          lte: filters.maxRate,

        };

      }

      if (filters?.isActive !== undefined) {

        where.isActive = filters.isActive;

      }

      if (filters?.isAvailable !== undefined) {

        where.isAvailable = filters.isAvailable;

      }

      // Check availability for specific date/time

      if (filters?.date && filters?.startTime && filters?.endTime) {

        // This will be handled in the availability check for each hall

        // We'll filter out unavailable halls after fetching them

      }

      // Build order by clause

      const sort: any = {};

      if (pagination?.sortBy) {

        sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;

      } else {

        sort.createdAt = -1;

      }

      // Execute query

      const [halls, total] = await Promise.all([

        HallModel.find(where).skip(skip).limit(limit).sort(sort).lean<Hall[]>(),

        HallModel.countDocuments(where),

      ]);

      // Generate pagination metadata

      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {

        data: halls,

        pagination: paginationMeta,

      };

    } catch (error) {

      logger.error('Failed to get halls:', error);

      throw error;

    }

  }

  /**

   * Update hall

   */

  public async updateHall(id: string, data: UpdateHallRequest): Promise<Hall> {

    try {

      if (!mongoose.Types.ObjectId.isValid(id)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      // Validate input data

      const validation = Validators.validateUpdateHall(data);

      if (!validation.isValid) {

        throw ErrorHandler.BadRequest(validation.errors.join(', '));

      }

      // Check if hall exists

      const existingHall = await HallModel.findById(id).lean();

      if (!existingHall) {

        throw ErrorHandler.NotFound('Hall not found');

      }

      // Check name uniqueness if name is being updated

      if (data.name && data.name !== existingHall.name) {

        const nameExists = await HallModel.findOne({ name: data.name }).lean();

        if (nameExists) {

          throw ErrorHandler.Conflict('Hall with this name already exists');

        }

      }

      // Update hall

      await HallModel.updateOne({ _id: id }, Helpers.removeUndefinedValues(data));

      const updatedHall = await HallModel.findById(id).lean<Hall>();

      if (!updatedHall) {

        throw ErrorHandler.createError('Failed to update hall', 500, 'InternalServerError');

      }

      // Clear cache

      await this.clearHallCache();

      await this.redisService.deleteCache(`hall:${id}`);

      logger.info('Hall updated successfully', { hallId: id, name: updatedHall.name });

      return updatedHall;

    } catch (error) {

      logger.error('Failed to update hall:', error);

      throw error;

    }

  }

  /**

   * Delete hall

   */

  public async deleteHall(id: string): Promise<boolean> {

    try {

      if (!mongoose.Types.ObjectId.isValid(id)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      // Check if hall exists

      const existingHall = await HallModel.findById(id).lean();

      if (!existingHall) {

        throw ErrorHandler.NotFound('Hall not found');

      }

      // Check if hall has active bookings

      const activeBookings = await HallBookingModel.find({ hallId: id, isCancelled: false, status: { $ne: 'COMPLETED' } }).limit(1).lean();

      if (activeBookings.length > 0) {

        throw ErrorHandler.Conflict('Cannot delete hall with active bookings');

      }

      // Check if hall has pending quotations

      const pendingQuotationsCount = await mongoose.model('HallQuotation').countDocuments({ hallId: id, status: { $in: ['DRAFT', 'SENT'] } });

      if (pendingQuotationsCount > 0) {

        throw ErrorHandler.Conflict('Cannot delete hall with pending quotations');

      }

      // Delete hall

      await HallModel.deleteOne({ _id: id });

      // Clear cache

      await this.clearHallCache();

      await this.redisService.deleteCache(`hall:${id}`);

      logger.info('Hall deleted successfully', { hallId: id, name: existingHall.name });

      return true;

    } catch (error) {

      logger.error('Failed to delete hall:', error);

      throw error;

    }

  }

  /**

   * Check hall availability for specific date and time

   */

  public async checkHallAvailability(

    hallId: string,

    date: string,

    startTime: string,

    endTime: string

  ): Promise<boolean> {

    try {

      if (!mongoose.Types.ObjectId.isValid(hallId)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      // Check if hall exists and is active

      const hall = await HallModel.findById(hallId).lean();

      if (!hall || !hall.isActive || !hall.isAvailable) {

        return false;

      }

      // Check for conflicting bookings

      const conflictingBooking = await HallBookingModel.findOne({

        hallId,

        startDate: { $lte: new Date(date) },

        endDate: { $gte: new Date(date) },

        isCancelled: false,

        status: { $ne: 'CANCELLED' },

      }).lean();

      if (conflictingBooking) {

        // Check time overlap

        const bookingStartTime = conflictingBooking.startTime;

        const bookingEndTime = conflictingBooking.endTime;

        

        if (this.isTimeOverlapping(startTime, endTime, bookingStartTime, bookingEndTime)) {

          return false;

        }

      }

      // Check for blocked availability

      const blockedAvailability = await HallAvailabilityModel.findOne({

        hallId,

        date: new Date(date),

        startTime: { $lte: startTime },

        endTime: { $gte: endTime },

        isAvailable: false,

      }).lean();

      if (blockedAvailability) {

        return false;

      }

      return true;

    } catch (error) {

      logger.error('Failed to check hall availability:', error);

      throw error;

    }

  }

  /**

   * Get hall with relations

   */

  public async getHallWithRelations(id: string): Promise<HallWithRelations | null> {

    try {

      if (!mongoose.Types.ObjectId.isValid(id)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      const hallCore = await HallModel.findById(id).lean();

      if (!hallCore) return null;

      const [bookings, quotations, lineItems] = await Promise.all([

        HallBookingModel.find({ hallId: id, isCancelled: false }).sort({ startDate: -1 }).limit(10).lean(),

        mongoose.model('HallQuotation').find({ hallId: id, status: { $in: ['DRAFT', 'SENT', 'ACCEPTED'] } }).sort({ createdAt: -1 }).limit(10).lean(),

        mongoose.model('HallLineItem').find({ hallId: id }).sort({ createdAt: -1 }).limit(20).lean(),

      ]);

      const hall: any = {

        ...hallCore,

        bookings,

        quotations,

        lineItems,

      };

      return hall;

    } catch (error) {

      logger.error('Failed to get hall with relations:', error);

      throw error;

    }

  }

  /**

   * Search halls by name or location

   */

  public async searchHalls(

    query: string,

    pagination?: PaginationParams

  ): Promise<PaginatedResponse<Hall>> {

    try {

      const page = pagination?.page || 1;

      const limit = pagination?.limit || 10;

      const skip = (page - 1) * limit;

      const where: any = {

        $and: [

          {

            $or: [

              { name: { $regex: query, $options: 'i' } },

              { location: { $regex: query, $options: 'i' } },

              { description: { $regex: query, $options: 'i' } },

            ],

          },

          { isActive: true },

          { isAvailable: true },

        ],

      };

      const [halls, total] = await Promise.all([

        HallModel.find(where).skip(skip).limit(limit).sort({ name: 1 }).lean<Hall[]>(),

        HallModel.countDocuments(where),

      ]);

      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {

        data: (halls as any[]).map((h) => ({ ...h, id: (h as any)._id?.toString?.() })) as unknown as Hall[],

        pagination: paginationMeta,

      };

    } catch (error) {

      logger.error('Failed to search halls:', error);

      throw error;

    }

  }

  /**

   * Get hall statistics

   */

  public async getHallStatistics(hallId: string): Promise<any> {

    try {

      if (!mongoose.Types.ObjectId.isValid(hallId)) {

        throw ErrorHandler.BadRequest('Invalid hall ID format');

      }

      const [totalBookings, completedBookings, cancelledBookings, totalRevenueAgg, averageBookingAgg, lastBooking] = await Promise.all([

        HallBookingModel.countDocuments({ hallId }),

        HallBookingModel.countDocuments({ hallId, status: 'COMPLETED' }),

        HallBookingModel.countDocuments({ hallId, isCancelled: true }),

        HallBookingModel.aggregate([

          { $match: { hallId: new mongoose.Types.ObjectId(hallId), status: 'COMPLETED' } },

          { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },

        ]),

        HallBookingModel.aggregate([

          { $match: { hallId: new mongoose.Types.ObjectId(hallId), status: 'COMPLETED' } },

          { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } },

        ]),

        HallBookingModel.findOne({ hallId }).sort({ createdAt: -1 }).select({ eventName: 1, startDate: 1, totalAmount: 1 }).lean(),

      ]);

      return {

        totalBookings,

        completedBookings,

        cancelledBookings,

        totalRevenue: (totalRevenueAgg[0]?.totalAmount as number) || 0,

        averageBookingValue: (averageBookingAgg[0]?.avgAmount as number) || 0,

        lastBooking,

        utilizationRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,

      };

    } catch (error) {

      logger.error('Failed to get hall statistics:', error);

      throw error;

    }

  }

  /**

   * Check if time ranges overlap

   */

  private isTimeOverlapping(

    start1: string,

    end1: string,

    start2: string,

    end2: string

  ): boolean {

    const start1Minutes = Helpers.timeToMinutes(start1);

    const end1Minutes = Helpers.timeToMinutes(end1);

    const start2Minutes = Helpers.timeToMinutes(start2);

    const end2Minutes = Helpers.timeToMinutes(end2);

    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;

  }

  /**

   * Clear hall cache

   */

  private async clearHallCache(): Promise<void> {

    try {

      // Note: Pattern-based key deletion is not directly supported by RedisService

      // We'll need to implement this differently or use a different approach

      // For now, we'll skip this functionality as it's not critical

      logger.info('Hall cache clear requested - pattern-based deletion not supported in RedisService');

    } catch (error) {

      logger.error('Failed to clear hall cache:', error);

    }

  }

}

export default HallService;
