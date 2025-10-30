import mongoose from 'mongoose';
import { RedisService } from '@/services/RedisService';
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
import { EventType as TypesEventType } from '@/types';
import { Validators } from '@/utils/validators';
import { Helpers } from '@/utils/helpers';
import { ErrorHandler } from '@/middleware/ErrorHandler';
import { CostCalculator } from '@/utils/costCalculator';
import { HallService } from './HallService';
import { BookingService } from './BookingService';
import HallModel from '@/models/Hall';
import HallQuotationModel from '@/models/HallQuotation';
import HallLineItemModel from '@/models/HallLineItem';
import { realtimeBus } from '@/realtime/eventBus';
import { publishEvent } from '@/events/kafka';

export class QuotationService {
  private hallService: HallService;
  private bookingService: BookingService;
  private redisService: RedisService;

  constructor() {
    this.hallService = new HallService();
    this.bookingService = new BookingService();
    this.redisService = new RedisService();
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
      const hall = await HallModel.findById(data.hallId).lean();

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
      const createdDoc = await HallQuotationModel.create({
        hallId: data.hallId,
        customerId: data.customerId,
        customerName: 'Customer',
        customerEmail: 'customer@example.com',
        customerPhone: '+1234567890',
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
      });
      const quotation = await HallQuotationModel.findById((createdDoc as any)._id).lean<HallQuotation>();

      // Create line items
      await Promise.all(
        costResult.lineItems.map(item =>
          HallLineItemModel.create({
            hallId: data.hallId,
            quotationId: (createdDoc as any)._id,
            itemType: item.itemType,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })
        )
      );

      // Clear cache
      await this.clearQuotationCache();

      logger.info('Quotation created successfully', { 
        quotationId: (createdDoc as any)._id?.toString?.(), 
        quotationNumber: quotation?.quotationNumber,
        hallId: quotation?.hallId,
        customerId: quotation?.customerId 
      });

      realtimeBus.emit('event', { type: 'quotation.created', payload: quotation });
      await publishEvent('hall.quotation', { type: 'quotation.created', quotation });

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check cache first
      const cacheKey = `quotation:${id}`;
      const cachedQuotation = await this.redisService.getCache(cacheKey);
      
      if (cachedQuotation) {
        return cachedQuotation;
      }

      // Fetch from database
      const quotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      if (quotation) {
        // Cache for 30 minutes
        await this.redisService.setCache(cacheKey, quotation, 1800);
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
      const quotation = await HallQuotationModel.findOne({ quotationNumber }).lean<HallQuotation>();

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
      const sort: any = {};
      if (pagination?.sortBy) {
        sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = -1;
      }

      // Execute query
      const [quotations, total] = await Promise.all([
        HallQuotationModel.find(where).skip(skip).limit(limit).sort(sort).lean<HallQuotation[]>(),
        HallQuotationModel.countDocuments(where),
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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Validate input data - for updates, we'll do basic validation
      if (data.eventDate && new Date(data.eventDate) < new Date()) {
        throw ErrorHandler.BadRequest('Event date cannot be in the past');
      }

      // Check if quotation exists
      const existingQuotation = await HallQuotationModel.findById(id).lean();

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
          hallId: String(existingQuotation.hallId),
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
      await HallQuotationModel.updateOne({ _id: id }, Helpers.removeUndefinedValues(updateData));
      const updatedQuotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      // Update line items if provided
      if (data.lineItems && data.lineItems.length > 0) {
        // Delete existing line items
        await HallLineItemModel.deleteMany({ quotationId: new mongoose.Types.ObjectId(id) });

        // Create new line items
        await Promise.all(
          data.lineItems.map(item =>
            HallLineItemModel.create({
              hallId: String(existingQuotation.hallId),
              quotationId: new mongoose.Types.ObjectId(id),
              itemType: item.itemType,
              itemName: item.itemName,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            })
          )
        );
      }

      // Clear cache
      await this.clearQuotationCache();
      await this.redisService.deleteCache(`quotation:${id}`);

      logger.info('Quotation updated successfully', { quotationId: id });

      realtimeBus.emit('event', { type: 'quotation.updated', payload: updatedQuotation });
      await publishEvent('hall.quotation', { type: 'quotation.updated', quotation: updatedQuotation });

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await HallQuotationModel.findById(id).lean();

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
        String(existingQuotation.hallId),
        availabilityEventDate,
        existingQuotation.startTime,
        existingQuotation.endTime
      );

      if (!isAvailable) {
        throw ErrorHandler.Conflict('Hall is no longer available for the selected date and time');
      }

      // Update quotation
      await HallQuotationModel.updateOne({ _id: id }, {
        isAccepted: true,
        status: QuotationStatus.ACCEPTED,
        acceptedAt: new Date(),
      });
      const updatedQuotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      // Create booking from quotation
      const bookingEventDate: string = (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]) as string;
      const booking = await this.bookingService.createBooking({
        hallId: String(existingQuotation.hallId),
        customerId: existingQuotation.customerId,
        eventName: existingQuotation.eventName,
        eventType: existingQuotation.eventType as unknown as TypesEventType,
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
      await this.redisService.deleteCache(`quotation:${id}`);

      logger.info('Quotation accepted successfully', { 
        quotationId: id, 
        bookingId: booking.id 
      });

      realtimeBus.emit('event', { type: 'quotation.accepted', payload: updatedQuotation });
      await publishEvent('hall.quotation', { type: 'quotation.accepted', quotation: updatedQuotation });

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await HallQuotationModel.findById(id).lean();

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
      await HallQuotationModel.updateOne({ _id: id }, { status: QuotationStatus.REJECTED });
      const updatedQuotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      // Clear cache
      await this.clearQuotationCache();
      await this.redisService.deleteCache(`quotation:${id}`);

      logger.info('Quotation rejected successfully', { quotationId: id });

      realtimeBus.emit('event', { type: 'quotation.rejected', payload: updatedQuotation });
      await publishEvent('hall.quotation', { type: 'quotation.rejected', quotation: updatedQuotation });

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await HallQuotationModel.findById(id).lean();

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
      await HallQuotationModel.updateOne({ _id: id }, { isExpired: true, status: QuotationStatus.EXPIRED });
      const updatedQuotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      // Clear cache
      await this.clearQuotationCache();
      await this.redisService.deleteCache(`quotation:${id}`);

      logger.info('Quotation expired successfully', { quotationId: id });

      realtimeBus.emit('event', { type: 'quotation.expired', payload: updatedQuotation });
      await publishEvent('hall.quotation', { type: 'quotation.expired', quotation: updatedQuotation });

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
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ErrorHandler.BadRequest('Invalid quotation ID format');
      }

      // Check if quotation exists
      const existingQuotation = await HallQuotationModel.findById(id).lean();

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
      await HallQuotationModel.updateOne({ _id: id }, { status: QuotationStatus.SENT });
      const updatedQuotation = await HallQuotationModel.findById(id).lean<HallQuotation>();

      // Clear cache
      await this.clearQuotationCache();
      await this.redisService.deleteCache(`quotation:${id}`);

      logger.info('Quotation sent successfully', { quotationId: id });

      realtimeBus.emit('event', { type: 'quotation.sent', payload: updatedQuotation });
      await publishEvent('hall.quotation', { type: 'quotation.sent', quotation: updatedQuotation });

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
        totalValueAgg,
        averageValueAgg,
      ] = await Promise.all([
        HallQuotationModel.countDocuments(where),
        HallQuotationModel.countDocuments({ ...where, status: QuotationStatus.DRAFT }),
        HallQuotationModel.countDocuments({ ...where, status: QuotationStatus.SENT }),
        HallQuotationModel.countDocuments({ ...where, status: QuotationStatus.ACCEPTED }),
        HallQuotationModel.countDocuments({ ...where, status: QuotationStatus.REJECTED }),
        HallQuotationModel.countDocuments({ ...where, status: QuotationStatus.EXPIRED }),
        HallQuotationModel.aggregate([
          { $match: { ...where, status: QuotationStatus.ACCEPTED } },
          { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
        ]),
        HallQuotationModel.aggregate([
          { $match: { ...where, status: QuotationStatus.ACCEPTED } },
          { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } },
        ]),
      ]);

      return {
        totalQuotations,
        draftQuotations,
        sentQuotations,
        acceptedQuotations,
        rejectedQuotations,
        expiredQuotations,
        totalValue: (totalValueAgg[0]?.totalAmount as number) || 0,
        averageValue: (averageValueAgg[0]?.avgAmount as number) || 0,
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
      // Note: Pattern-based key deletion is not directly supported by RedisService
      // We'll need to implement this differently or use a different approach
      // For now, we'll skip this functionality as it's not critical
      logger.info('Quotation cache clear requested - pattern-based deletion not supported in RedisService');
    } catch (error) {
      logger.error('Failed to clear quotation cache:', error);
    }
  }
}

export default QuotationService;
