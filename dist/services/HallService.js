"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const RedisService_1 = require("@/services/RedisService");
const logger_1 = require("@/utils/logger");
const validators_1 = require("@/utils/validators");
const helpers_1 = require("@/utils/helpers");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const Hall_1 = __importDefault(require("@/models/Hall"));
const HallBooking_1 = __importDefault(require("@/models/HallBooking"));
const HallAvailability_1 = __importDefault(require("@/models/HallAvailability"));
class HallService {
    constructor() {
        this.redisService = new RedisService_1.RedisService();
    }
    async createHall(data) {
        try {
            const validation = validators_1.Validators.validateCreateHall(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const existingHall = await Hall_1.default.findOne({ name: data.name }).lean();
            if (existingHall) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Hall with this name already exists');
            }
            const hall = await Hall_1.default.create({
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
            await this.clearHallCache();
            const created = await Hall_1.default.findById(hall._id).lean();
            logger_1.logger.info('Hall created successfully', { hallId: hall._id?.toString?.(), name: created?.name });
            return created;
        }
        catch (error) {
            logger_1.logger.error('Failed to create hall:', error);
            throw error;
        }
    }
    async getHallById(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const cacheKey = `hall:${id}`;
            const cachedHall = await this.redisService.getCache(cacheKey);
            if (cachedHall) {
                return cachedHall;
            }
            const hall = await Hall_1.default.findById(id).lean();
            if (hall) {
                await this.redisService.setCache(cacheKey, hall, 3600);
            }
            return hall;
        }
        catch (error) {
            logger_1.logger.error('Failed to get hall by ID:', error);
            throw error;
        }
    }
    async getHalls(filters, pagination) {
        try {
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const skip = (page - 1) * limit;
            const where = {};
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
            if (filters?.date && filters?.startTime && filters?.endTime) {
            }
            const sort = {};
            if (pagination?.sortBy) {
                sort[pagination.sortBy] = pagination.sortOrder === 'asc' ? 1 : -1;
            }
            else {
                sort.createdAt = -1;
            }
            const [halls, total] = await Promise.all([
                Hall_1.default.find(where).skip(skip).limit(limit).sort(sort).lean(),
                Hall_1.default.countDocuments(where),
            ]);
            const paginationMeta = helpers_1.Helpers.generatePaginationMetadata(page, limit, total);
            return {
                data: halls,
                pagination: paginationMeta,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get halls:', error);
            throw error;
        }
    }
    async updateHall(id, data) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const validation = validators_1.Validators.validateUpdateHall(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const existingHall = await Hall_1.default.findById(id).lean();
            if (!existingHall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            if (data.name && data.name !== existingHall.name) {
                const nameExists = await Hall_1.default.findOne({ name: data.name }).lean();
                if (nameExists) {
                    throw ErrorHandler_1.ErrorHandler.Conflict('Hall with this name already exists');
                }
            }
            await Hall_1.default.updateOne({ _id: id }, helpers_1.Helpers.removeUndefinedValues(data));
            const updatedHall = await Hall_1.default.findById(id).lean();
            if (!updatedHall) {
                throw ErrorHandler_1.ErrorHandler.createError('Failed to update hall', 500, 'InternalServerError');
            }
            await this.clearHallCache();
            await this.redisService.deleteCache(`hall:${id}`);
            logger_1.logger.info('Hall updated successfully', { hallId: id, name: updatedHall.name });
            return updatedHall;
        }
        catch (error) {
            logger_1.logger.error('Failed to update hall:', error);
            throw error;
        }
    }
    async deleteHall(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const existingHall = await Hall_1.default.findById(id).lean();
            if (!existingHall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            const activeBookings = await HallBooking_1.default.find({ hallId: id, isCancelled: false, status: { $ne: 'COMPLETED' } }).limit(1).lean();
            if (activeBookings.length > 0) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot delete hall with active bookings');
            }
            const pendingQuotationsCount = await mongoose_1.default.model('HallQuotation').countDocuments({ hallId: id, status: { $in: ['DRAFT', 'SENT'] } });
            if (pendingQuotationsCount > 0) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot delete hall with pending quotations');
            }
            await Hall_1.default.deleteOne({ _id: id });
            await this.clearHallCache();
            await this.redisService.deleteCache(`hall:${id}`);
            logger_1.logger.info('Hall deleted successfully', { hallId: id, name: existingHall.name });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete hall:', error);
            throw error;
        }
    }
    async checkHallAvailability(hallId, date, startTime, endTime) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(hallId)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const hall = await Hall_1.default.findById(hallId).lean();
            if (!hall || !hall.isActive || !hall.isAvailable) {
                return false;
            }
            const conflictingBooking = await HallBooking_1.default.findOne({
                hallId,
                startDate: { $lte: new Date(date) },
                endDate: { $gte: new Date(date) },
                isCancelled: false,
                status: { $ne: 'CANCELLED' },
            }).lean();
            if (conflictingBooking) {
                const bookingStartTime = conflictingBooking.startTime;
                const bookingEndTime = conflictingBooking.endTime;
                if (this.isTimeOverlapping(startTime, endTime, bookingStartTime, bookingEndTime)) {
                    return false;
                }
            }
            const blockedAvailability = await HallAvailability_1.default.findOne({
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
        }
        catch (error) {
            logger_1.logger.error('Failed to check hall availability:', error);
            throw error;
        }
    }
    async getHallWithRelations(id) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const hallCore = await Hall_1.default.findById(id).lean();
            if (!hallCore)
                return null;
            const [bookings, quotations, lineItems] = await Promise.all([
                HallBooking_1.default.find({ hallId: id, isCancelled: false }).sort({ startDate: -1 }).limit(10).lean(),
                mongoose_1.default.model('HallQuotation').find({ hallId: id, status: { $in: ['DRAFT', 'SENT', 'ACCEPTED'] } }).sort({ createdAt: -1 }).limit(10).lean(),
                mongoose_1.default.model('HallLineItem').find({ hallId: id }).sort({ createdAt: -1 }).limit(20).lean(),
            ]);
            const hall = {
                ...hallCore,
                bookings,
                quotations,
                lineItems,
            };
            return hall;
        }
        catch (error) {
            logger_1.logger.error('Failed to get hall with relations:', error);
            throw error;
        }
    }
    async searchHalls(query, pagination) {
        try {
            const page = pagination?.page || 1;
            const limit = pagination?.limit || 10;
            const skip = (page - 1) * limit;
            const where = {
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
                Hall_1.default.find(where).skip(skip).limit(limit).sort({ name: 1 }).lean(),
                Hall_1.default.countDocuments(where),
            ]);
            const paginationMeta = helpers_1.Helpers.generatePaginationMetadata(page, limit, total);
            return {
                data: halls.map((h) => ({ ...h, id: h._id?.toString?.() })),
                pagination: paginationMeta,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to search halls:', error);
            throw error;
        }
    }
    async getHallStatistics(hallId) {
        try {
            if (!mongoose_1.default.Types.ObjectId.isValid(hallId)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const [totalBookings, completedBookings, cancelledBookings, totalRevenueAgg, averageBookingAgg, lastBooking] = await Promise.all([
                HallBooking_1.default.countDocuments({ hallId }),
                HallBooking_1.default.countDocuments({ hallId, status: 'COMPLETED' }),
                HallBooking_1.default.countDocuments({ hallId, isCancelled: true }),
                HallBooking_1.default.aggregate([
                    { $match: { hallId: new mongoose_1.default.Types.ObjectId(hallId), status: 'COMPLETED' } },
                    { $group: { _id: null, totalAmount: { $sum: '$totalAmount' } } },
                ]),
                HallBooking_1.default.aggregate([
                    { $match: { hallId: new mongoose_1.default.Types.ObjectId(hallId), status: 'COMPLETED' } },
                    { $group: { _id: null, avgAmount: { $avg: '$totalAmount' } } },
                ]),
                HallBooking_1.default.findOne({ hallId }).sort({ createdAt: -1 }).select({ eventName: 1, startDate: 1, totalAmount: 1 }).lean(),
            ]);
            return {
                totalBookings,
                completedBookings,
                cancelledBookings,
                totalRevenue: totalRevenueAgg[0]?.totalAmount || 0,
                averageBookingValue: averageBookingAgg[0]?.avgAmount || 0,
                lastBooking,
                utilizationRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get hall statistics:', error);
            throw error;
        }
    }
    isTimeOverlapping(start1, end1, start2, end2) {
        const start1Minutes = helpers_1.Helpers.timeToMinutes(start1);
        const end1Minutes = helpers_1.Helpers.timeToMinutes(end1);
        const start2Minutes = helpers_1.Helpers.timeToMinutes(start2);
        const end2Minutes = helpers_1.Helpers.timeToMinutes(end2);
        return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
    }
    async clearHallCache() {
        try {
            logger_1.logger.info('Hall cache clear requested - pattern-based deletion not supported in RedisService');
        }
        catch (error) {
            logger_1.logger.error('Failed to clear hall cache:', error);
        }
    }
}
exports.HallService = HallService;
exports.default = HallService;
//# sourceMappingURL=HallService.js.map