"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HallController = void 0;
const HallService_1 = require("@/services/HallService");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const ValidationMiddleware_1 = require("@/middleware/ValidationMiddleware");
const AuthMiddleware_1 = require("@/middleware/AuthMiddleware");
const RateLimitMiddleware_1 = require("@/middleware/RateLimitMiddleware");
class HallController {
    constructor() {
        this.createHall = async (req, res, next) => {
            try {
                const hall = await this.hallService.createHall(req.body);
                const response = {
                    success: true,
                    message: 'Hall created successfully',
                    data: hall,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(201).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHallById = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const hall = await this.hallService.getHallById(id);
                if (!hall) {
                    const response = {
                        success: false,
                        message: 'Hall not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Hall retrieved successfully',
                    data: hall,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHalls = async (req, res, next) => {
            try {
                const filters = {
                    ...(req.query.location && { location: req.query.location }),
                    ...(req.query.capacity && { capacity: parseInt(req.query.capacity) }),
                    ...(req.query.minCapacity && { minCapacity: parseInt(req.query.minCapacity) }),
                    ...(req.query.maxCapacity && { maxCapacity: parseInt(req.query.maxCapacity) }),
                    ...(req.query.eventType && { eventType: req.query.eventType }),
                    ...(req.query.date && { date: req.query.date }),
                    ...(req.query.startTime && { startTime: req.query.startTime }),
                    ...(req.query.endTime && { endTime: req.query.endTime }),
                    ...(req.query.amenities && { amenities: req.query.amenities.split(',') }),
                    ...(req.query.minRate && { minRate: parseFloat(req.query.minRate) }),
                    ...(req.query.maxRate && { maxRate: parseFloat(req.query.maxRate) }),
                    ...(req.query.isActive !== undefined && { isActive: req.query.isActive === 'true' }),
                    ...(req.query.isAvailable !== undefined && { isAvailable: req.query.isAvailable === 'true' }),
                };
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.hallService.getHalls(filters, pagination);
                const response = {
                    success: true,
                    message: 'Halls retrieved successfully',
                    data: result.data,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                response.pagination = result.pagination;
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.updateHall = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const hall = await this.hallService.updateHall(id, req.body);
                const response = {
                    success: true,
                    message: 'Hall updated successfully',
                    data: hall,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.deleteHall = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const deleted = await this.hallService.deleteHall(id);
                if (!deleted) {
                    const response = {
                        success: false,
                        message: 'Failed to delete hall',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(500).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Hall deleted successfully',
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.checkAvailability = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const { date, startTime, endTime } = req.query;
                if (!date || !startTime || !endTime) {
                    const response = {
                        success: false,
                        message: 'Date, startTime, and endTime are required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const isAvailable = await this.hallService.checkHallAvailability(id, date, startTime, endTime);
                const response = {
                    success: true,
                    message: 'Availability checked successfully',
                    data: {
                        hallId: id,
                        date,
                        startTime,
                        endTime,
                        isAvailable,
                    },
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHallWithRelations = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const hall = await this.hallService.getHallWithRelations(id);
                if (!hall) {
                    const response = {
                        success: false,
                        message: 'Hall not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Hall with relations retrieved successfully',
                    data: hall,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.searchHalls = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    const response = {
                        success: false,
                        message: 'Search query is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.hallService.searchHalls(q, pagination);
                const response = {
                    success: true,
                    message: 'Halls searched successfully',
                    data: result.data,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                response.pagination = result.pagination;
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getHallStatistics = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const statistics = await this.hallService.getHallStatistics(id);
                const response = {
                    success: true,
                    message: 'Hall statistics retrieved successfully',
                    data: statistics,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.hallService = new HallService_1.HallService();
    }
    static routes() {
        const controller = new HallController();
        const express = require('express');
        const router = express.Router();
        router.use(RateLimitMiddleware_1.RateLimitMiddleware.general);
        router.post('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireAdmin, ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.createHall), ErrorHandler_1.ErrorHandler.asyncHandler(controller.createHall));
        router.get('/', AuthMiddleware_1.AuthMiddleware.optionalAuth, ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHalls));
        router.get('/search', ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.searchHalls));
        router.get('/:id', AuthMiddleware_1.AuthMiddleware.optionalAuth, ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHallById));
        router.get('/:id/relations', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHallWithRelations));
        router.get('/:id/availability', ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.checkAvailability));
        router.get('/:id/statistics', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHallStatistics));
        router.put('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireAdmin, ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.updateHall), ErrorHandler_1.ErrorHandler.asyncHandler(controller.updateHall));
        router.delete('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireAdmin, ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.deleteHall));
        return router;
    }
}
exports.HallController = HallController;
exports.default = HallController;
//# sourceMappingURL=HallController.js.map