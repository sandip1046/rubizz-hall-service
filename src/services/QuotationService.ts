import { PrismaClient } from '@prisma/client';
import { database } from '@/database/DatabaseConnection';
import { redis } from '@/database/RedisConnection';
import { logger } from '@/utils/logger';
import { 
  HallQuotation, 
  CreateQuotationRequest, 
  UpdateQuotationRequest, 
  QuotationSearchFilters, 
  PaginationParams, 
  PaginatedResponse,
  QuotationWithRelations,
  QuotationStatus,
  CreateLineItemRequest,
  CostCalculationRequest
} from '@/types';
import { Validators } from '@/utils/validators';
import { Helpers } from '@/utils/helpers';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { CostCalculator } from '@/utils/costCalculator';
import { HallService } from './HallService';
import { BookingService } from './BookingService';

export class QuotationService {
  private prisma: PrismaClient;
  private hallService: HallService;
  private bookingService: BookingService;

  constructor() {
    this.prisma = database.getPrisma();
    this.hallService = new HallService();
    this.bookingService = new BookingService();
  }

  /**
   * Create a new quotation
   */
  public async createQuotation(data: CreateQuotationRequest): Promise<HallQuotation> {
    try {
      // Validate input data
      const validation = Validators.validateCreateQuotation(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Check if hall exists
      const hall = await this.prisma.hall.findUnique({
        where: { id: data.hallId },
      });

      if (!hall) {
        throw ErrorHandler.NotFound('Hall not found');
      }

      // Generate quotation number
      const quotationNumber = CostCalculator.generateQuotationNumber();

      // Calculate costs
      const costCalculation: CostCalculationRequest = {
        hallId: data.hallId,
        eventDate: data.eventDate,
        startTime: data.startTime,
        endTime: data.endTime,
        guestCount: data.guestCount,
        lineItems: data.lineItems,
      };

      const costResult = CostCalculator.calculateCost(costCalculation);

      // Set validity period (default 7 days from creation)
      const validUntil = data.validUntil 
        ? new Date(data.validUntil)
        : Helpers.addDays(new Date(), 7);

      // Create quotation
      const quotation = await this.prisma.hallQuotation.create({
        data: {
          hallId: data.hallId,
          customerId: data.customerId,
          customerName: 'Customer', // TODO: Get from customer service
          customerEmail: 'customer@example.com', // TODO: Get from customer service
          customerPhone: '+1234567890', // TODO: Get from customer service
          quotationNumber,
          eventName: data.eventName,
          eventType: data.eventType,
          eventDate: new Date(data.eventDate),
          startTime: data.startTime,
          endTime: data.endTime,
          guestCount: data.guestCount,
          baseAmount: costResult.baseAmount,
          subtotal: costResult.subtotal,
          taxAmount: costResult.taxAmount,
          totalAmount: costResult.totalAmount,
          validUntil,
          status: QuotationStatus.DRAFT,
        },
      });

      // Create line items
      const lineItems = await Promise.all(
        costResult.lineItems.map(item =>
          this.prisma.hallLineItem.create({
            data: {
              hallId: data.hallId,
              quotationId: quotation.id,
              itemType: item.itemType,
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
            },
          })
        )
      );

      // Clear cache
      await this.clearQuotationCache();

      logger.info('Quotation created successfully', { 
        quotationId: quotation.id, 
        quotationNumber: quotation.quotationNumber,
        hallId: quotation.hallId,
        customerId: quotation.customerId 
      });

      return { ...quotation, lineItems: [], acceptedAt: null } as HallQuotation;
    } catch (error) {
      logger.error('Failed to create quotation:', error);
      throw error;
    }
  }

  /**
   * Get quotation by ID
   */
  public async getQuotationById(id: string): Promise<HallQuotation | null> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check cache first
      const cacheKey = `quotation:${id}`;
      const cachedQuotation = await redis.get(cacheKey);
      
      if (cachedQuotation) {
        return JSON.parse(cachedQuotation);
      }

      // Fetch from database
      const quotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      if (quotation) {
        // Cache for 30 minutes
        await redis.set(cacheKey, JSON.stringify(quotation), 1800);
      }

      return { ...quotation, lineItems: [], acceptedAt: null } as HallQuotation | null;
    } catch (error) {
      logger.error('Failed to get quotation by ID:', error);
      throw error;
    }
  }

  /**
   * Get quotation by quotation number
   */
  public async getQuotationByNumber(quotationNumber: string): Promise<HallQuotation | null> {
    try {
      const quotation = await this.prisma.hallQuotation.findUnique({
        where: { quotationNumber },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      return { ...quotation, lineItems: [], acceptedAt: null } as HallQuotation | null;
    } catch (error) {
      logger.error('Failed to get quotation by number:', error);
      throw error;
    }
  }

  /**
   * Get quotations with filters and pagination
   */
  public async getQuotations(
    filters?: QuotationSearchFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<HallQuotation>> {
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

      if (filters?.isAccepted !== undefined) {
        where.isAccepted = filters.isAccepted;
      }

      if (filters?.isExpired !== undefined) {
        where.isExpired = filters.isExpired;
      }

      if (filters?.eventDate) {
        where.eventDate = new Date(filters.eventDate);
      }

      if (filters?.validUntil) {
        where.validUntil = {
          lte: new Date(filters.validUntil),
        };
      }

      // Build order by clause
      const orderBy: any = {};
      if (pagination?.sortBy) {
        orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      // Execute query
      const [quotations, total] = await Promise.all([
        this.prisma.hallQuotation.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            hall: true,
            lineItems: true,
          },
        }),
        this.prisma.hallQuotation.count({ where }),
      ]);

      // Generate pagination metadata
      const paginationMeta = Helpers.generatePaginationMetadata(page, limit, total);

      return {
        data: quotations as HallQuotation[],
        pagination: paginationMeta,
      };
    } catch (error) {
      logger.error('Failed to get quotations:', error);
      throw error;
    }
  }

  /**
   * Update quotation
   */
  public async updateQuotation(id: string, data: UpdateQuotationRequest): Promise<HallQuotation> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Validate input data - for updates, we'll do basic validation
      if (data.eventDate && new Date(data.eventDate) < new Date()) {
        throw ErrorHandler.BadRequest('Event date cannot be in the past');
      }

      // Check if quotation exists
      const existingQuotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
      });

      if (!existingQuotation) {
        throw ErrorHandler.NotFound('Quotation not found');
      }

      // Check if quotation can be updated
      if (existingQuotation.isAccepted) {
        throw ErrorHandler.Conflict('Cannot update accepted quotation');
      }

      if (existingQuotation.isExpired) {
        throw ErrorHandler.Conflict('Cannot update expired quotation');
      }

      // Recalculate costs if line items are updated
      let updatedData = { ...data };
      if (data.lineItems && data.lineItems.length > 0) {
        const costEventDate: string = (data.eventDate ?? (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0])) as string;
        const costCalculation: CostCalculationRequest = {
          hallId: existingQuotation.hallId,
          eventDate: costEventDate,
          startTime: data.startTime || existingQuotation.startTime,
          endTime: data.endTime || existingQuotation.endTime,
          guestCount: data.guestCount || existingQuotation.guestCount,
          lineItems: data.lineItems,
        };

        const costResult = CostCalculator.calculateCost(costCalculation);
        // Note: Prisma doesn't support updating subtotal directly
        // We'll handle this in the line items update
        updatedData = {
          ...updatedData,
          taxAmount: costResult.taxAmount,
          totalAmount: costResult.totalAmount,
        };
      }

      // Remove lineItems from update data as it's handled separately
      const { lineItems, ...updateData } = updatedData;
      
      // Update quotation
      const updatedQuotation = await this.prisma.hallQuotation.update({
        where: { id },
        data: Helpers.removeUndefinedValues(updateData),
        include: {
          hall: true,
          lineItems: true,
        },
      });

      // Update line items if provided
      if (data.lineItems && data.lineItems.length > 0) {
        // Delete existing line items
        await this.prisma.hallLineItem.deleteMany({
          where: { quotationId: id },
        });

        // Create new line items
        await Promise.all(
          data.lineItems.map(item =>
            this.prisma.hallLineItem.create({
              data: {
                hallId: existingQuotation.hallId,
                quotationId: id,
                itemType: item.itemType,
                itemName: item.itemName,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice,
              },
            })
          )
        );
      }

      // Clear cache
      await this.clearQuotationCache();
      await redis.del(`quotation:${id}`);

      logger.info('Quotation updated successfully', { quotationId: id });

      return updatedQuotation as HallQuotation;
    } catch (error) {
      logger.error('Failed to update quotation:', error);
      throw error;
    }
  }

  /**
   * Accept quotation
   */
  public async acceptQuotation(id: string): Promise<HallQuotation> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
      });

      if (!existingQuotation) {
        throw ErrorHandler.NotFound('Quotation not found');
      }

      // Check if quotation can be accepted
      if (existingQuotation.isAccepted) {
        throw ErrorHandler.Conflict('Quotation is already accepted');
      }

      if (existingQuotation.isExpired) {
        throw ErrorHandler.Conflict('Cannot accept expired quotation');
      }

      if (existingQuotation.status !== QuotationStatus.SENT) {
        throw ErrorHandler.Conflict('Only sent quotations can be accepted');
      }

      // Check if hall is still available
      const availabilityEventDate: string = (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]) as string;
      const isAvailable = await this.hallService.checkHallAvailability(
        existingQuotation.hallId,
        availabilityEventDate,
        existingQuotation.startTime,
        existingQuotation.endTime
      );

      if (!isAvailable) {
        throw ErrorHandler.Conflict('Hall is no longer available for the selected date and time');
      }

      // Update quotation
      const updatedQuotation = await this.prisma.hallQuotation.update({
        where: { id },
        data: {
          isAccepted: true,
          status: QuotationStatus.ACCEPTED,
          acceptedAt: new Date(),
        },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      // Create booking from quotation
      const bookingEventDate: string = (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]) as string;
      const booking = await this.bookingService.createBooking({
        hallId: existingQuotation.hallId,
        customerId: existingQuotation.customerId,
        eventName: existingQuotation.eventName,
        eventType: existingQuotation.eventType,
        startDate: bookingEventDate,
        endDate: bookingEventDate,
        startTime: existingQuotation.startTime,
        endTime: existingQuotation.endTime,
        guestCount: existingQuotation.guestCount,
        specialRequests: null,
        quotationId: id,
      });

      // Note: Booking relation removed from schema

      // Clear cache
      await this.clearQuotationCache();
      await redis.del(`quotation:${id}`);

      logger.info('Quotation accepted successfully', { 
        quotationId: id, 
        bookingId: booking.id 
      });

      return updatedQuotation as HallQuotation;
    } catch (error) {
      logger.error('Failed to accept quotation:', error);
      throw error;
    }
  }

  /**
   * Reject quotation
   */
  public async rejectQuotation(id: string): Promise<HallQuotation> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
      });

      if (!existingQuotation) {
        throw ErrorHandler.NotFound('Quotation not found');
      }

      // Check if quotation can be rejected
      if (existingQuotation.isAccepted) {
        throw ErrorHandler.Conflict('Cannot reject accepted quotation');
      }

      if (existingQuotation.isExpired) {
        throw ErrorHandler.Conflict('Cannot reject expired quotation');
      }

      // Update quotation
      const updatedQuotation = await this.prisma.hallQuotation.update({
        where: { id },
        data: {
          status: QuotationStatus.REJECTED,
        },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      // Clear cache
      await this.clearQuotationCache();
      await redis.del(`quotation:${id}`);

      logger.info('Quotation rejected successfully', { quotationId: id });

      return updatedQuotation as HallQuotation;
    } catch (error) {
      logger.error('Failed to reject quotation:', error);
      throw error;
    }
  }

  /**
   * Expire quotation
   */
  public async expireQuotation(id: string): Promise<HallQuotation> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
      });

      if (!existingQuotation) {
        throw ErrorHandler.NotFound('Quotation not found');
      }

      // Check if quotation can be expired
      if (existingQuotation.isAccepted) {
        throw ErrorHandler.Conflict('Cannot expire accepted quotation');
      }

      if (existingQuotation.isExpired) {
        throw ErrorHandler.Conflict('Quotation is already expired');
      }

      // Update quotation
      const updatedQuotation = await this.prisma.hallQuotation.update({
        where: { id },
        data: {
          isExpired: true,
          status: QuotationStatus.EXPIRED,
        },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      // Clear cache
      await this.clearQuotationCache();
      await redis.del(`quotation:${id}`);

      logger.info('Quotation expired successfully', { quotationId: id });

      return updatedQuotation as HallQuotation;
    } catch (error) {
      logger.error('Failed to expire quotation:', error);
      throw error;
    }
  }

  /**
   * Send quotation (change status from DRAFT to SENT)
   */
  public async sendQuotation(id: string): Promise<HallQuotation> {
    try {
      // Validate UUID
      if (!Validators.isValidUUID(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await this.prisma.hallQuotation.findUnique({
        where: { id },
      });

      if (!existingQuotation) {
        throw ErrorHandler.NotFound('Quotation not found');
      }

      // Check if quotation can be sent
      if (existingQuotation.status !== QuotationStatus.DRAFT) {
        throw ErrorHandler.Conflict('Only draft quotations can be sent');
      }

      if (existingQuotation.isExpired) {
        throw ErrorHandler.Conflict('Cannot send expired quotation');
      }

      // Update quotation
      const updatedQuotation = await this.prisma.hallQuotation.update({
        where: { id },
        data: {
          status: QuotationStatus.SENT,
        },
        include: {
          hall: true,
          lineItems: true,
        },
      });

      // Clear cache
      await this.clearQuotationCache();
      await redis.del(`quotation:${id}`);

      logger.info('Quotation sent successfully', { quotationId: id });

      return updatedQuotation as HallQuotation;
    } catch (error) {
      logger.error('Failed to send quotation:', error);
      throw error;
    }
  }

  /**
   * Calculate quotation cost
   */
  public async calculateQuotationCost(data: CostCalculationRequest): Promise<any> {
    try {
      // Validate cost calculation request
      const validation = CostCalculator.validateCostRequest(data);
      if (!validation.isValid) {
        throw ErrorHandler.BadRequest(validation.errors.join(', '));
      }

      // Calculate cost
      const costResult = CostCalculator.calculateCost(data);

      return costResult;
    } catch (error) {
      logger.error('Failed to calculate quotation cost:', error);
      throw error;
    }
  }

  /**
   * Get quotation statistics
   */
  public async getQuotationStatistics(filters?: {
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
        where.eventDate = {
          gte: new Date(filters.startDate),
        };
      }

      if (filters?.endDate) {
        where.eventDate = {
          lte: new Date(filters.endDate),
        };
      }

      const [
        totalQuotations,
        draftQuotations,
        sentQuotations,
        acceptedQuotations,
        rejectedQuotations,
        expiredQuotations,
        totalValue,
        averageValue,
      ] = await Promise.all([
        this.prisma.hallQuotation.count({ where }),
        this.prisma.hallQuotation.count({
          where: { ...where, status: QuotationStatus.DRAFT },
        }),
        this.prisma.hallQuotation.count({
          where: { ...where, status: QuotationStatus.SENT },
        }),
        this.prisma.hallQuotation.count({
          where: { ...where, status: QuotationStatus.ACCEPTED },
        }),
        this.prisma.hallQuotation.count({
          where: { ...where, status: QuotationStatus.REJECTED },
        }),
        this.prisma.hallQuotation.count({
          where: { ...where, status: QuotationStatus.EXPIRED },
        }),
        this.prisma.hallQuotation.aggregate({
          where: { ...where, status: QuotationStatus.ACCEPTED },
          _sum: { totalAmount: true },
        }),
        this.prisma.hallQuotation.aggregate({
          where: { ...where, status: QuotationStatus.ACCEPTED },
          _avg: { totalAmount: true },
        }),
      ]);

      return {
        totalQuotations,
        draftQuotations,
        sentQuotations,
        acceptedQuotations,
        rejectedQuotations,
        expiredQuotations,
        totalValue: totalValue._sum.totalAmount || 0,
        averageValue: averageValue._avg.totalAmount || 0,
        acceptanceRate: totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0,
        rejectionRate: totalQuotations > 0 ? (rejectedQuotations / totalQuotations) * 100 : 0,
        expirationRate: totalQuotations > 0 ? (expiredQuotations / totalQuotations) * 100 : 0,
      };
    } catch (error) {
      logger.error('Failed to get quotation statistics:', error);
      throw error;
    }
  }

  /**
   * Clear quotation cache
   */
  private async clearQuotationCache(): Promise<void> {
    try {
      const pattern = 'quotation:*';
      const keys = await redis.getClient().keys(pattern);
      if (keys.length > 0) {
        await redis.getClient().del(keys);
      }
    } catch (error) {
      logger.error('Failed to clear quotation cache:', error);
    }
  }
}

export default QuotationService;
