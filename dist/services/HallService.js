"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallService = void 0;
const DatabaseConnection_1 = require("@/database/DatabaseConnection");
const RedisConnection_1 = require("@/database/RedisConnection");
const logger_1 = require("@/utils/logger");
const validators_1 = require("@/utils/validators");
const helpers_1 = require("@/utils/helpers");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
class HallService {
    constructor() {
        this.prisma = DatabaseConnection_1.database.getPrisma();
    }
    async createHall(data) {
        try {
            const validation = validators_1.Validators.validateCreateHall(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const existingHall = await this.prisma.hall.findFirst({
                where: { name: data.name },
            });
            if (existingHall) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Hall with this name already exists');
            }
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
            await this.clearHallCache();
            logger_1.logger.info('Hall created successfully', { hallId: hall.id, name: hall.name });
            return hall;
        }
        catch (error) {
            logger_1.logger.error('Failed to create hall:', error);
            throw error;
        }
    }
    async getHallById(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const cacheKey = `hall:${id}`;
            const cachedHall = await RedisConnection_1.redis.get(cacheKey);
            if (cachedHall) {
                return JSON.parse(cachedHall);
            }
            const hall = await this.prisma.hall.findUnique({
                where: { id },
            });
            if (hall) {
                await RedisConnection_1.redis.set(cacheKey, JSON.stringify(hall), 3600);
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
            const orderBy = {};
            if (pagination?.sortBy) {
                orderBy[pagination.sortBy] = pagination.sortOrder || 'desc';
            }
            else {
                orderBy.createdAt = 'desc';
            }
            const [halls, total] = await Promise.all([
                this.prisma.hall.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy,
                }),
                this.prisma.hall.count({ where }),
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
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const validation = validators_1.Validators.validateUpdateHall(data);
            if (!validation.isValid) {
                throw ErrorHandler_1.ErrorHandler.BadRequest(validation.errors.join(', '));
            }
            const existingHall = await this.prisma.hall.findUnique({
                where: { id },
            });
            if (!existingHall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            if (data.name && data.name !== existingHall.name) {
                const nameExists = await this.prisma.hall.findFirst({
                    where: { name: data.name },
                });
                if (nameExists) {
                    throw ErrorHandler_1.ErrorHandler.Conflict('Hall with this name already exists');
                }
            }
            const updatedHall = await this.prisma.hall.update({
                where: { id },
                data: helpers_1.Helpers.removeUndefinedValues(data),
            });
            await this.clearHallCache();
            await RedisConnection_1.redis.del(`hall:${id}`);
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
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const existingHall = await this.prisma.hall.findUnique({
                where: { id },
                include: {
                    bookings: true,
                    quotations: true,
                },
            });
            if (!existingHall) {
                throw ErrorHandler_1.ErrorHandler.NotFound('Hall not found');
            }
            const activeBookings = existingHall.bookings.filter(booking => !booking.isCancelled && booking.status !== 'COMPLETED');
            if (activeBookings.length > 0) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot delete hall with active bookings');
            }
            const pendingQuotations = existingHall.quotations.filter(quotation => quotation.status === 'DRAFT' || quotation.status === 'SENT');
            if (pendingQuotations.length > 0) {
                throw ErrorHandler_1.ErrorHandler.Conflict('Cannot delete hall with pending quotations');
            }
            await this.prisma.hall.delete({
                where: { id },
            });
            await this.clearHallCache();
            await RedisConnection_1.redis.del(`hall:${id}`);
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
            if (!validators_1.Validators.isValidUUID(hallId)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const hall = await this.prisma.hall.findUnique({
                where: { id: hallId },
            });
            if (!hall || !hall.isActive || !hall.isAvailable) {
                return false;
            }
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
                const bookingStartTime = conflictingBooking.startTime;
                const bookingEndTime = conflictingBooking.endTime;
                if (this.isTimeOverlapping(startTime, endTime, bookingStartTime, bookingEndTime)) {
                    return false;
                }
            }
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
        }
        catch (error) {
            logger_1.logger.error('Failed to check hall availability:', error);
            throw error;
        }
    }
    async getHallWithRelations(id) {
        try {
            if (!validators_1.Validators.isValidUUID(id)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
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
                OR: [
                    {
                        name: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        location: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        description: {
                            contains: query,
                            mode: 'insensitive',
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
            const paginationMeta = helpers_1.Helpers.generatePaginationMetadata(page, limit, total);
            return {
                data: halls,
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
            if (!validators_1.Validators.isValidUUID(hallId)) {
                throw ErrorHandler_1.ErrorHandler.BadRequest('Invalid hall ID format');
            }
            const [totalBookings, completedBookings, cancelledBookings, totalRevenue, averageBookingValue, lastBooking,] = await Promise.all([
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
            const pattern = 'hall:*';
            const keys = await RedisConnection_1.redis.getClient().keys(pattern);
            if (keys.length > 0) {
                await RedisConnection_1.redis.getClient().del(keys);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to clear hall cache:', error);
        }
    }
}
exports.HallService = HallService;
exports.default = HallService;
//# sourceMappingURL=HallService.js.map