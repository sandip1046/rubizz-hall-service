"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationService = void 0;
const DatabaseConnection_1 = require("@/database/DatabaseConnection");
const RedisConnection_1 = require("@/database/RedisConnection");
const logger_1 = require("@/utils/logger");
const types_1 = require("@/types");
const validators_1 = require("@/utils/validators");
const helpers_1 = require("@/utils/helpers");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const costCalculator_1 = require("@/utils/costCalculator");
const HallService_1 = require("./HallService");
const BookingService_1 = require("./BookingService");
class QuotationService {
    constructor() {
        this.prisma = DatabaseConnection_1.database.getPrisma();
        this.hallService = new HallService_1.HallService();
        this.bookingService = new BookingService_1.BookingService();
    }
    async createQuotation(data) {
        try {
            const validation = validators_1.Validators.validateCreateQuotation(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const hall = await this.prisma.hall.findUnique({
                where: { id: data.hallId },
            });
            if (!hall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            const quotationNumber = costCalculator_1.CostCalculator.generateQuotationNumber();
            const costCalculation = {
                hallId: data.hallId,
                eventDate: data.eventDate,
                startTime: data.startTime,
                endTime: data.endTime,
                guestCount: data.guestCount,
                lineItems: data.lineItems,
            };
            const costResult = costCalculator_1.CostCalculator.calculateCost(costCalculation);
            const validUntil = data.validUntil
                ? new Date(data.validUntil)
                : helpers_1.Helpers.addDays(new Date(), 7);
            const quotation = await this.prisma.hallQuotation.create({
                data: {
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
                    status: types_1.QuotationStatus.DRAFT,
                },
            });
            const lineItems = await Promise.all(costResult.lineItems.map(item => this.prisma.hallLineItem.create({
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
            })));
            await this.clearQuotationCache();
            logger_1.logger.info('Quotation created successfully', {
                quotationId: quotation.id,
                quotationNumber: quotation.quotationNumber,
                hallId: quotation.hallId,
                customerId: quotation.customerId
            });
            return { ...quotation, lineItems: [], acceptedAt: null };
        }
        catch (error) {
            logger_1.logger.error('Failed to create quotation:', error);
            throw error;
        }
    }
    async getQuotationById(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            const cacheKey = `quotation:${id}`;
            const cachedQuotation = await RedisConnection_1.redis.get(cacheKey);
            if (cachedQuotation) {
                return JSON.parse(cachedQuotation);
            }
            const quotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            if (quotation) {
                await RedisConnection_1.redis.set(cacheKey, JSON.stringify(quotation), 1800);
            }
            return { ...quotation, lineItems: [], acceptedAt: null };
        }
        catch (error) {
            logger_1.logger.error('Failed to get quotation by ID:', error);
            throw error;
        }
    }
    async getQuotationByNumber(quotationNumber) {
        try {
            const quotation = await this.prisma.hallQuotation.findUnique({
                where: { quotationNumber },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            return { ...quotation, lineItems: [], acceptedAt: null };
        }
        catch (error) {
            logger_1.logger.error('Failed to get quotation by number:', error);
            throw error;
        }
    }
    async getQuotations(filters, pagination) {
        try {
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const skip = (page - 1) * limit;
            const where = {};
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
            const orderBy = {};
            if (pagination?.sortBy) {
                orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
            }
            else {
                orderBy.createdAt = 'desc';
            }
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
            const paginationMeta = helpers_1.Helpers.generatePaginationMetadata(page, limit, total);
            return {
                data: quotations,
                pagination: paginationMeta,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get quotations:', error);
            throw error;
        }
    }
    async updateQuotation(id, data) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            if (data.eventDate && new Date(data.eventDate) < new Date()) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Event date cannot be in the past');
            }
            const existingQuotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
            });
            if (!existingQuotation) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Quotation not found');
            }
            if (existingQuotation.isAccepted) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot update accepted quotation');
            }
            if (existingQuotation.isExpired) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot update expired quotation');
            }
            let updatedData = { ...data };
            if (data.lineItems && data.lineItems.length > 0) {
                const costEventDate = (data.eventDate ?? (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]));
                const costCalculation = {
                    hallId: existingQuotation.hallId,
                    eventDate: costEventDate,
                    startTime: data.startTime || existingQuotation.startTime,
                    endTime: data.endTime || existingQuotation.endTime,
                    guestCount: data.guestCount || existingQuotation.guestCount,
                    lineItems: data.lineItems,
                };
                const costResult = costCalculator_1.CostCalculator.calculateCost(costCalculation);
                updatedData = {
                    ...updatedData,
                    taxAmount: costResult.taxAmount,
                    totalAmount: costResult.totalAmount,
                };
            }
            const { lineItems, ...updateData } = updatedData;
            const updatedQuotation = await this.prisma.hallQuotation.update({
                where: { id },
                data: helpers_1.Helpers.removeUndefinedValues(updateData),
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            if (data.lineItems && data.lineItems.length > 0) {
                await this.prisma.hallLineItem.deleteMany({
                    where: { quotationId: id },
                });
                await Promise.all(data.lineItems.map(item => this.prisma.hallLineItem.create({
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
                })));
            }
            await this.clearQuotationCache();
            await RedisConnection_1.redis.del(`quotation:${id}`);
            logger_1.logger.info('Quotation updated successfully', { quotationId: id });
            return updatedQuotation;
        }
        catch (error) {
            logger_1.logger.error('Failed to update quotation:', error);
            throw error;
        }
    }
    async acceptQuotation(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            const existingQuotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
            });
            if (!existingQuotation) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Quotation not found');
            }
            if (existingQuotation.isAccepted) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Quotation is already accepted');
            }
            if (existingQuotation.isExpired) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot accept expired quotation');
            }
            if (existingQuotation.status !== types_1.QuotationStatus.SENT) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Only sent quotations can be accepted');
            }
            const availabilityEventDate = (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]);
            const isAvailable = await this.hallService.checkHallAvailability(existingQuotation.hallId, availabilityEventDate, existingQuotation.startTime, existingQuotation.endTime);
            if (!isAvailable) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Hall is no longer available for the selected date and time');
            }
            const updatedQuotation = await this.prisma.hallQuotation.update({
                where: { id },
                data: {
                    isAccepted: true,
                    status: types_1.QuotationStatus.ACCEPTED,
                    acceptedAt: new Date(),
                },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            const bookingEventDate = (existingQuotation.eventDate?.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0]);
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
            await this.clearQuotationCache();
            await RedisConnection_1.redis.del(`quotation:${id}`);
            logger_1.logger.info('Quotation accepted successfully', {
                quotationId: id,
                bookingId: booking.id
            });
            return updatedQuotation;
        }
        catch (error) {
            logger_1.logger.error('Failed to accept quotation:', error);
            throw error;
        }
    }
    async rejectQuotation(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            const existingQuotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
            });
            if (!existingQuotation) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Quotation not found');
            }
            if (existingQuotation.isAccepted) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot reject accepted quotation');
            }
            if (existingQuotation.isExpired) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot reject expired quotation');
            }
            const updatedQuotation = await this.prisma.hallQuotation.update({
                where: { id },
                data: {
                    status: types_1.QuotationStatus.REJECTED,
                },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            await this.clearQuotationCache();
            await RedisConnection_1.redis.del(`quotation:${id}`);
            logger_1.logger.info('Quotation rejected successfully', { quotationId: id });
            return updatedQuotation;
        }
        catch (error) {
            logger_1.logger.error('Failed to reject quotation:', error);
            throw error;
        }
    }
    async expireQuotation(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            const existingQuotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
            });
            if (!existingQuotation) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Quotation not found');
            }
            if (existingQuotation.isAccepted) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot expire accepted quotation');
            }
            if (existingQuotation.isExpired) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Quotation is already expired');
            }
            const updatedQuotation = await this.prisma.hallQuotation.update({
                where: { id },
                data: {
                    isExpired: true,
                    status: types_1.QuotationStatus.EXPIRED,
                },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            await this.clearQuotationCache();
            await RedisConnection_1.redis.del(`quotation:${id}`);
            logger_1.logger.info('Quotation expired successfully', { quotationId: id });
            return updatedQuotation;
        }
        catch (error) {
            logger_1.logger.error('Failed to expire quotation:', error);
            throw error;
        }
    }
    async sendQuotation(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid quotation ID format');
            }
            const existingQuotation = await this.prisma.hallQuotation.findUnique({
                where: { id },
            });
            if (!existingQuotation) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Quotation not found');
            }
            if (existingQuotation.status !== types_1.QuotationStatus.DRAFT) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Only draft quotations can be sent');
            }
            if (existingQuotation.isExpired) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot send expired quotation');
            }
            const updatedQuotation = await this.prisma.hallQuotation.update({
                where: { id },
                data: {
                    status: types_1.QuotationStatus.SENT,
                },
                include: {
                    hall: true,
                    lineItems: true,
                },
            });
            await this.clearQuotationCache();
            await RedisConnection_1.redis.del(`quotation:${id}`);
            logger_1.logger.info('Quotation sent successfully', { quotationId: id });
            return updatedQuotation;
        }
        catch (error) {
            logger_1.logger.error('Failed to send quotation:', error);
            throw error;
        }
    }
    async calculateQuotationCost(data) {
        try {
            const validation = costCalculator_1.CostCalculator.validateCostRequest(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const costResult = costCalculator_1.CostCalculator.calculateCost(data);
            return costResult;
        }
        catch (error) {
            logger_1.logger.error('Failed to calculate quotation cost:', error);
            throw error;
        }
    }
    async getQuotationStatistics(filters) {
        try {
            const where = {};
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
            const [totalQuotations, draftQuotations, sentQuotations, acceptedQuotations, rejectedQuotations, expiredQuotations, totalValue, averageValue,] = await Promise.all([
                this.prisma.hallQuotation.count({ where }),
                this.prisma.hallQuotation.count({
                    where: { ...where, status: types_1.QuotationStatus.DRAFT },
                }),
                this.prisma.hallQuotation.count({
                    where: { ...where, status: types_1.QuotationStatus.SENT },
                }),
                this.prisma.hallQuotation.count({
                    where: { ...where, status: types_1.QuotationStatus.ACCEPTED },
                }),
                this.prisma.hallQuotation.count({
                    where: { ...where, status: types_1.QuotationStatus.REJECTED },
                }),
                this.prisma.hallQuotation.count({
                    where: { ...where, status: types_1.QuotationStatus.EXPIRED },
                }),
                this.prisma.hallQuotation.aggregate({
                    where: { ...where, status: types_1.QuotationStatus.ACCEPTED },
                    _sum: { totalAmount: true },
                }),
                this.prisma.hallQuotation.aggregate({
                    where: { ...where, status: types_1.QuotationStatus.ACCEPTED },
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get quotation statistics:', error);
            throw error;
        }
    }
    async clearQuotationCache() {
        try {
            const pattern = 'quotation:*';
            const keys = await RedisConnection_1.redis.getClient().keys(pattern);
            if (keys.length > 0) {
                await RedisConnection_1.redis.getClient().del(keys);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to clear quotation cache:', error);
        }
    }
}
exports.QuotationService = QuotationService;
exports.default = QuotationService;
//# sourceMappingURL=QuotationService.js.map