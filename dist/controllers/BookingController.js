"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const BookingService_1 = require("@/services/BookingService");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const ValidationMiddleware_1 = require("@/middleware/ValidationMiddleware");
const AuthMiddleware_1 = require("@/middleware/AuthMiddleware");
const RateLimitMiddleware_1 = require("@/middleware/RateLimitMiddleware");
class BookingController {
    constructor() {
        this.createBooking = async (req, res, next) => {
            try {
                const booking = await this.bookingService.createBooking(req.body);
                const response = {
                    success: true,
                    message: 'Booking created successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(201).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getBookingById = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.getBookingById(id);
                if (!booking) {
                    const response = {
                        success: false,
                        message: 'Booking not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Booking retrieved successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getBookings = async (req, res, next) => {
            try {
                const filters = {
                    ...(req.query.hallId && { hallId: req.query.hallId }),
                    ...(req.query.customerId && { customerId: req.query.customerId }),
                    ...(req.query.eventType && { eventType: req.query.eventType }),
                    ...(req.query.status && { status: req.query.status }),
                    ...(req.query.paymentStatus && { paymentStatus: req.query.paymentStatus }),
                    ...(req.query.startDate && { startDate: req.query.startDate }),
                    ...(req.query.endDate && { endDate: req.query.endDate }),
                    ...(req.query.isConfirmed !== undefined && { isConfirmed: req.query.isConfirmed === 'true' }),
                    ...(req.query.isCancelled !== undefined && { isCancelled: req.query.isCancelled === 'true' }),
                };
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.bookingService.getBookings(filters, pagination);
                const response = {
                    success: true,
                    message: 'Bookings retrieved successfully',
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
        this.updateBooking = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.updateBooking(id, req.body);
                const response = {
                    success: true,
                    message: 'Booking updated successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.cancelBooking = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const { reason } = req.body;
                if (!reason) {
                    const response = {
                        success: false,
                        message: 'Cancellation reason is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.cancelBooking(id, reason);
                const response = {
                    success: true,
                    message: 'Booking cancelled successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.confirmBooking = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.confirmBooking(id);
                const response = {
                    success: true,
                    message: 'Booking confirmed successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.checkInBooking = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.checkInBooking(id);
                const response = {
                    success: true,
                    message: 'Booking checked in successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.checkOutBooking = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Booking ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const booking = await this.bookingService.checkOutBooking(id);
                const response = {
                    success: true,
                    message: 'Booking checked out successfully',
                    data: booking,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getBookingStatistics = async (req, res, next) => {
            try {
                const filters = {
                    ...(req.query.hallId && { hallId: req.query.hallId }),
                    ...(req.query.customerId && { customerId: req.query.customerId }),
                    ...(req.query.startDate && { startDate: req.query.startDate }),
                    ...(req.query.endDate && { endDate: req.query.endDate }),
                };
                const statistics = await this.bookingService.getBookingStatistics(filters);
                const response = {
                    success: true,
                    message: 'Booking statistics retrieved successfully',
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
        this.getCustomerBookings = async (req, res, next) => {
            try {
                const customerId = req.user?.id;
                if (!customerId) {
                    const response = {
                        success: false,
                        message: 'Customer ID not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(401).json(response);
                    return;
                }
                const filters = {
                    customerId,
                    ...req.query,
                };
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.bookingService.getBookings(filters, pagination);
                const response = {
                    success: true,
                    message: 'Customer bookings retrieved successfully',
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
        this.getHallBookings = async (req, res, next) => {
            try {
                const { hallId } = req.params;
                if (!hallId) {
                    const response = {
                        success: false,
                        message: 'Hall ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const filters = {
                    hallId,
                    ...req.query,
                };
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.bookingService.getBookings(filters, pagination);
                const response = {
                    success: true,
                    message: 'Hall bookings retrieved successfully',
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
        this.bookingService = new BookingService_1.BookingService();
    }
    static routes() {
        const controller = new BookingController();
        const express = require('express');
        const router = express.Router();
        router.use(RateLimitMiddleware_1.RateLimitMiddleware.general);
        router.post('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.createBooking), ErrorHandler_1.ErrorHandler.asyncHandler(controller.createBooking));
        router.get('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateSearchFilters, ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getBookings));
        router.get('/my-bookings', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireCustomer, ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getCustomerBookings));
        router.get('/hall/:hallId', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('hallId'), ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHallBookings));
        router.get('/statistics', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getBookingStatistics));
        router.get('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getBookingById));
        router.put('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.updateBooking), ErrorHandler_1.ErrorHandler.asyncHandler(controller.updateBooking));
        router.post('/:id/cancel', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.cancelBooking));
        router.post('/:id/confirm', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.confirmBooking));
        router.post('/:id/checkin', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.checkInBooking));
        router.post('/:id/checkout', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.checkOutBooking));
        return router;
    }
}
exports.BookingController = BookingController;
exports.default = BookingController;
//# sourceMappingURL=BookingController.js.map