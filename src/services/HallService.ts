import { PrismaClient } from '@prisma/client';
import { database } from '@/database/DatabaseConnection';
import { redis } from '@/database/RedisConnection';
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

export class HallService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = database.getPrisma();
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
      const existingHall = await this.prisma.hall.findFirst({
        where: { name: data.name },
      });

      if (existingHall) {
        throw ErrorHandler.Conflict('Hall with this name already exists');
      }

      // Create hall
      const hall = await this.prisma.hall.create({
        data: {
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
        },
      });

      // Clear cache
      await this.clearHallCache();

      logger.info('Hall created successfully', { hallId: hall.id, name: hall.name });

      return hall;
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
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      // Check cache first
      const cacheKey = `hall:${id}`;
      const cachedHall = await redis.get(cacheKey);
      
      if (cachedHall) {
        return JSON.parse(cachedHall);
      }

      // Fetch from database
      const hall = await this.prisma.hall.findUnique({
        where: { id },
      });

      if (hall) {
        // Cache for 1 hour
        await redis.set(cacheKey, JSON.stringify(hall), 3600);
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
      const orderBy: any = {};
      if (pagination?.sortBy) {
        orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Execute query
      const [halls, total] = await Promise.all([
        this.prisma.hall.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.hall.count({ where }),
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
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      // Validate input data
      const validation = Validators.validateUpdateHall(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Check if hall exists
      const existingHall = await this.prisma.hall.findUnique({
        where: { id },
      });

      if (!existingHall) {
        throw ErrorHandler.NotFound('Hall not found');
      }

      // Check name uniqueness if name is being updated
      if (data.name && data.name !== existingHall.name) {
        const nameExists = await this.prisma.hall.findFirst({
          where: { name: data.name },
        });

        if (nameExists) {
          throw ErrorHandler.Conflict('Hall with this name already exists');
        }
      }

      // Update hall
      const updatedHall = await this.prisma.hall.update({
        where: { id },
        data: Helpers.removeUndefinedValues(data),
      });

      // Clear cache
      await this.clearHallCache();
      await redis.del(`hall:${id}`);

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
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      // Check if hall exists
      const existingHall = await this.prisma.hall.findUnique({
        where: { id },
        include: {
          bookings: true,
          quotations: true,
        },
      });

      if (!existingHall) {
        throw ErrorHandler.NotFound('Hall not found');
      }

      // Check if hall has active bookings
      const activeBookings = existingHall.bookings.filter(
        booking => !booking.isCancelled && booking.status !== 'COMPLETED'
      );

      if (activeBookings.length > 0) {
        throw ErrorHandler.Conflict('Cannot delete hall with active bookings');
      }

      // Check if hall has pending quotations
      const pendingQuotations = existingHall.quotations.filter(
        quotation => quotation.status === 'DRAFT' || quotation.status === 'SENT'
      );

      if (pendingQuotations.length > 0) {
        throw ErrorHandler.Conflict('Cannot delete hall with pending quotations');
      }

      // Delete hall
      await this.prisma.hall.delete({
        where: { id },
      });

      // Clear cache
      await this.clearHallCache();
      await redis.del(`hall:${id}`);

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
      // Validate UUID
      if (!Validators.isValidUUID(hallId)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      // Check if hall exists and is active
      const hall = await this.prisma.hall.findUnique({
        where: { id: hallId },
      });

      if (!hall || !hall.isActive || !hall.isAvailable) {
        return false;
      }

      // Check for conflicting bookings
      const conflictingBooking = await this.prisma.hallBooking.findFirst({
        where: {
          hallId,
          startDate: {
            lte: new Date(date),
          },
          endDate: {
            gte: new Date(date),
          },
          isCancelled: false,
          status: {
            not: 'CANCELLED',
          },
        },
      });

      if (conflictingBooking) {
        // Check time overlap
        const bookingStartTime = conflictingBooking.startTime;
        const bookingEndTime = conflictingBooking.endTime;
        
        if (this.isTimeOverlapping(startTime, endTime, bookingStartTime, bookingEndTime)) {
          return false;
        }
      }

      // Check for blocked availability
      const blockedAvailability = await this.prisma.hallAvailability.findFirst({
        where: {
          hallId,
          date: new Date(date),
          startTime: {
            lte: startTime,
          },
          endTime: {
            gte: endTime,
          },
          isAvailable: false,
        },
      });

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
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      const hall = await this.prisma.hall.findUnique({
        where: { id },
        include: {
          bookings: {
            where: {
              isCancelled: false,
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 10,
          },
          quotations: {
            where: {
              status: {
                in: ['DRAFT', 'SENT', 'ACCEPTED'],
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
            include: {
              lineItems: true,
            },
          },
          lineItems: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
        },
      });

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

      const where = {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          {
            location: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
          {
            description: {
              contains: query,
              mode: 'insensitive' as const,
            },
          },
        ],
        isActive: true,
        isAvailable: true,
      };

      const [halls, total] = await Promise.all([
        this.prisma.hall.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.hall.count({ where }),
      ]);

      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {
        data: halls,
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
      // Validate UUID
      if (!Validators.isValidUUID(hallId)) {
        throw ErrorHandler.BadRequest('Invalid hall ID format');
      }

      const [
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        averageBookingValue,
        lastBooking,
      ] = await Promise.all([
        this.prisma.hallBooking.count({
          where: { hallId },
        }),
        this.prisma.hallBooking.count({
          where: { hallId, status: 'COMPLETED' },
        }),
        this.prisma.hallBooking.count({
          where: { hallId, isCancelled: true },
        }),
        this.prisma.hallBooking.aggregate({
          where: { hallId, status: 'COMPLETED' },
          _sum: { totalAmount: true },
        }),
        this.prisma.hallBooking.aggregate({
          where: { hallId, status: 'COMPLETED' },
          _avg: { totalAmount: true },
        }),
        this.prisma.hallBooking.findFirst({
          where: { hallId },
          orderBy: { createdAt: 'desc' },
          select: {
            eventName: true,
            startDate: true,
            totalAmount: true,
          },
        }),
      ]);

      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        averageBookingValue: averageBookingValue._avg.totalAmount || 0,
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
      const pattern = 'hall:*';
      const keys = await redis.getClient().keys(pattern);
      if (keys.length > 0) {
        await redis.getClient().del(keys);
      }
    } catch (error) {
      logger.error('Failed to clear hall cache:', error);
    }
  }
}

export default HallService;
