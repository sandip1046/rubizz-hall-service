"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const RedisService_1 = require("@/services/RedisService");
const logger_1 = require("@/utils/logger");
const types_1 = require("@/types");
const validators_1 = require("@/utils/validators");
const helpers_1 = require("@/utils/helpers");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const costCalculator_1 = require("@/utils/costCalculator");
const HallService_1 = require("./HallService");
const Hall_1 = __importDefault(require("@/models/Hall"));
const HallBooking_1 = __importDefault(require("@/models/HallBooking"));
class BookingService {
    constructor() {
        this.hallService = new HallService_1.HallService();
        this.redisService = new RedisService_1.RedisService();
    }
    async createBooking(data) {
        try {
            const validation = validators_1.Validators.validateCreateBooking(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const isAvailable = await this.hallService.checkHallAvailability(data.hallId, data.startDate, data.startTime, data.endTime);
            if (!isAvailable) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Hall is not available for the selected date and time');
            }
            const hall = await Hall_1.default.findById(data.hallId).lean();
            if (!hall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            const duration = helpers_1.Helpers.getTimeDifferenceInHours(data.startTime, data.endTime);
            const baseAmount = this.calculateBaseAmount(hall, data.startDate, duration);
            const additionalCharges = 0;
            const taxAmount = ((baseAmount + additionalCharges) * 18) / 100;
            const totalAmount = baseAmount + additionalCharges + taxAmount;
            const createdDoc = await HallBooking_1.default.create({
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
                depositAmount: costCalculator_1.CostCalculator.calculateDepositAmount(totalAmount),
                balanceAmount: totalAmount - costCalculator_1.CostCalculator.calculateDepositAmount(totalAmount),
                depositPaid: false,
                status: types_1.BookingStatus.PENDING,
                paymentStatus: types_1.PaymentStatus.PENDING,
            });
            const booking = await HallBooking_1.default.findById(createdDoc._id).lean();
            if (!booking) {
                throw ErrorHandler_1.ErrorHandler.createError('Failed to create booking', 500, 'InternalServerError');
            }
            await this.clearBookingCache();
            logger_1.logger.info('Booking created successfully', {
                bookingId: booking.id,
                hallId: booking.hallId,
                customerId: booking.customerId
            });
            return booking;
        }
        catch (error) {
            logger_1.logger.error('Failed to create booking:', error);
            throw error;
        }
    }
    async getBookingById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const cacheKey = `booking:${id}`;
            const cachedBooking = await this.redisService.getCache(cacheKey);
            if (cachedBooking) {
                return cachedBooking;
            }
            const booking = await HallBooking_1.default.findById(id).lean();
            if (booking) {
                await this.redisService.setCache(cacheKey, booking, 1800);
            }
            return booking;
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking by ID:', error);
            throw error;
        }
    }
    async getBookings(filters, pagination) {
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
            const sort = {};
            if (pagination?.sortBy) {
                sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;
            }
            else {
                sort.createdAt = -1;
            }
            const [bookings, total] = await Promise.all([
                HallBooking_1.default.find(where).skip(skip).limit(limit).sort(sort).lean(),
                HallBooking_1.default.countDocuments(where),
            ]);
            const paginationMeta = helpers_1.Helpers.generatePaginationMetadata(page, limit, total);
            return {
                data: bookings,
                pagination: paginationMeta,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get bookings:', error);
            throw error;
        }
    }
    async updateBooking(id, data) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const validation = validators_1.Validators.validateUpdateBooking(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const existingBooking = await HallBooking_1.default.findById(id).lean();
            if (!existingBooking) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Booking not found');
            }
            if (existingBooking.isCancelled) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot update cancelled booking');
            }
            if (existingBooking.status === types_1.BookingStatus.COMPLETED) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot update completed booking');
            }
            if (data.startDate || data.startTime || data.endTime) {
                const startDate = data.startDate || existingBooking.startDate.toISOString().split('T')[0];
                const startTime = data.startTime || existingBooking.startTime;
                const endTime = data.endTime || existingBooking.endTime;
                const isAvailable = await this.hallService.checkHallAvailability(String(existingBooking.hallId), startDate, startTime, endTime);
                if (!isAvailable) {
                    throw ErrorHandler_1.ErrorHandler.Conflict('Hall is not available for the selected date and time');
                }
            }
            await HallBooking_1.default.updateOne({ _id: id }, helpers_1.Helpers.removeUndefinedValues(data));
            const updatedBooking = await HallBooking_1.default.findById(id).lean();
            await this.clearBookingCache();
            await this.redisService.deleteCache(`booking:${id}`);
            logger_1.logger.info('Booking updated successfully', { bookingId: id });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Failed to update booking:', error);
            throw error;
        }
    }
    async cancelBooking(id, reason) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const existingBooking = await HallBooking_1.default.findById(id).lean();
            if (!existingBooking) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Booking not found');
            }
            if (existingBooking.isCancelled) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Booking is already cancelled');
            }
            if (existingBooking.status === types_1.BookingStatus.COMPLETED) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot cancel completed booking');
            }
            const refundAmount = costCalculator_1.CostCalculator.calculateRefundAmount(existingBooking.totalAmount, existingBooking.totalAmount, 24, existingBooking.startDate);
            await HallBooking_1.default.updateOne({ _id: id }, {
                isCancelled: true,
                status: types_1.BookingStatus.CANCELLED,
                cancellationReason: reason,
                cancelledAt: new Date(),
            });
            const updatedBooking = await HallBooking_1.default.findById(id).lean();
            await this.clearBookingCache();
            await this.redisService.deleteCache(`booking:${id}`);
            logger_1.logger.info('Booking cancelled successfully', {
                bookingId: id,
                refundAmount,
                reason
            });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Failed to cancel booking:', error);
            throw error;
        }
    }
    async confirmBooking(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const existingBooking = await HallBooking_1.default.findById(id).lean();
            if (!existingBooking) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Booking not found');
            }
            if (existingBooking.isCancelled) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot confirm cancelled booking');
            }
            if (existingBooking.isConfirmed) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Booking is already confirmed');
            }
            await HallBooking_1.default.updateOne({ _id: id }, {
                isConfirmed: true,
                status: types_1.BookingStatus.CONFIRMED,
                confirmedAt: new Date(),
            });
            const updatedBooking = await HallBooking_1.default.findById(id).lean();
            await this.clearBookingCache();
            await this.redisService.deleteCache(`booking:${id}`);
            logger_1.logger.info('Booking confirmed successfully', { bookingId: id });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Failed to confirm booking:', error);
            throw error;
        }
    }
    async checkInBooking(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const existingBooking = await HallBooking_1.default.findById(id).lean();
            if (!existingBooking) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Booking not found');
            }
            if (existingBooking.isCancelled) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot check in cancelled booking');
            }
            if (!existingBooking.isConfirmed) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Booking must be confirmed before check-in');
            }
            if (existingBooking.status === types_1.BookingStatus.CHECKED_IN) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Booking is already checked in');
            }
            await HallBooking_1.default.updateOne({ _id: id }, { status: types_1.BookingStatus.CHECKED_IN });
            const updatedBooking = await HallBooking_1.default.findById(id).lean();
            await this.clearBookingCache();
            await this.redisService.deleteCache(`booking:${id}`);
            logger_1.logger.info('Booking checked in successfully', { bookingId: id });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Failed to check in booking:', error);
            throw error;
        }
    }
    async checkOutBooking(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid booking ID format');
            }
            const existingBooking = await HallBooking_1.default.findById(id).lean();
            if (!existingBooking) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Booking not found');
            }
            if (existingBooking.isCancelled) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot check out cancelled booking');
            }
            if (existingBooking.status !== types_1.BookingStatus.CHECKED_IN) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Booking must be checked in before check-out');
            }
            await HallBooking_1.default.updateOne({ _id: id }, { status: types_1.BookingStatus.COMPLETED });
            const updatedBooking = await HallBooking_1.default.findById(id).lean();
            await this.clearBookingCache();
            await this.redisService.deleteCache(`booking:${id}`);
            logger_1.logger.info('Booking checked out successfully', { bookingId: id });
            return updatedBooking;
        }
        catch (error) {
            logger_1.logger.error('Failed to check out booking:', error);
            throw error;
        }
    }
    async getBookingStatistics(filters) {
        try {
            const where = {};
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
            const [totalBookings, confirmedBookings, completedBookings, cancelledBookings, totalRevenueAgg, averageBookingAgg,] = await Promise.all([
                HallBooking_1.default.countDocuments(where),
                HallBooking_1.default.countDocuments({ ...where, isConfirmed: true }),
                HallBooking_1.default.countDocuments({ ...where, status: types_1.BookingStatus.COMPLETED }),
                HallBooking_1.default.countDocuments({ ...where, isCancelled: true }),
                HallBooking_1.default.aggregate([
                    { $match: { ...where, status: types_1.BookingStatus.COMPLETED } },
                    { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
                ]),
                HallBooking_1.default.aggregate([
                    { $match: { ...where, status: types_1.BookingStatus.COMPLETED } },
                    { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } },
                ]),
            ]);
            return {
                totalBookings,
                confirmedBookings,
                completedBookings,
                cancelledBookings,
                totalRevenue: totalRevenueAgg[0]?.totalAmount || 0,
                averageBookingValue: averageBookingAgg[0]?.avgAmount || 0,
                confirmationRate: totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0,
                completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
                cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get booking statistics:', error);
            throw error;
        }
    }
    calculateBaseAmount(hall, startDate, duration) {
        const eventDate = new Date(startDate);
        const isWeekend = helpers_1.Helpers.isWeekend(eventDate);
        let baseRate = hall.baseRate;
        if (isWeekend && hall.weekendRate) {
            baseRate = hall.weekendRate;
        }
        if (duration <= 4) {
            return baseRate;
        }
        else if (duration <= 8) {
            return baseRate * 1.5;
        }
        else {
            return baseRate * 2;
        }
    }
    async clearBookingCache() {
        try {
            logger_1.logger.info('Booking cache clear requested - pattern-based deletion not supported in RedisService');
        }
        catch (error) {
            logger_1.logger.error('Failed to clear booking cache:', error);
        }
    }
}
exports.BookingService = BookingService;
exports.default = BookingService;
//# sourceMappingURL=BookingService.js.map