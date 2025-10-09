"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationController = void 0;
const QuotationService_1 = require("@/services/QuotationService");
const ErrorHandler_1 = require("@/middleware/ErrorHandler");
const ValidationMiddleware_1 = require("@/middleware/ValidationMiddleware");
const AuthMiddleware_1 = require("@/middleware/AuthMiddleware");
const RateLimitMiddleware_1 = require("@/middleware/RateLimitMiddleware");
class QuotationController {
    constructor() {
        this.createQuotation = async (req, res, next) => {
            try {
                const quotation = await this.quotationService.createQuotation(req.body);
                const response = {
                    success: true,
                    message: 'Quotation created successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(201).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getQuotationById = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.getQuotationById(id);
                if (!quotation) {
                    const response = {
                        success: false,
                        message: 'Quotation not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Quotation retrieved successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getQuotationByNumber = async (req, res, next) => {
            try {
                const { quotationNumber } = req.params;
                if (!quotationNumber) {
                    const response = {
                        success: false,
                        message: 'Quotation number is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.getQuotationByNumber(quotationNumber);
                if (!quotation) {
                    const response = {
                        success: false,
                        message: 'Quotation not found',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(404).json(response);
                    return;
                }
                const response = {
                    success: true,
                    message: 'Quotation retrieved successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getQuotations = async (req, res, next) => {
            try {
                const filters = {
                    ...(req.query.hallId && { hallId: req.query.hallId }),
                    ...(req.query.customerId && { customerId: req.query.customerId }),
                    ...(req.query.eventType && { eventType: req.query.eventType }),
                    ...(req.query.status && { status: req.query.status }),
                    ...(req.query.isAccepted !== undefined && { isAccepted: req.query.isAccepted === 'true' }),
                    ...(req.query.isExpired !== undefined && { isExpired: req.query.isExpired === 'true' }),
                    ...(req.query.eventDate && { eventDate: req.query.eventDate }),
                    ...(req.query.validUntil && { validUntil: req.query.validUntil }),
                };
                const pagination = {
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 10,
                    sortBy: req.query.sortBy,
                    sortOrder: req.query.sortOrder,
                };
                const result = await this.quotationService.getQuotations(filters, pagination);
                const response = {
                    success: true,
                    message: 'Quotations retrieved successfully',
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
        this.updateQuotation = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.updateQuotation(id, req.body);
                const response = {
                    success: true,
                    message: 'Quotation updated successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.acceptQuotation = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.acceptQuotation(id);
                const response = {
                    success: true,
                    message: 'Quotation accepted successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.rejectQuotation = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.rejectQuotation(id);
                const response = {
                    success: true,
                    message: 'Quotation rejected successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.expireQuotation = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.expireQuotation(id);
                const response = {
                    success: true,
                    message: 'Quotation expired successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.sendQuotation = async (req, res, next) => {
            try {
                const { id } = req.params;
                if (!id) {
                    const response = {
                        success: false,
                        message: 'Quotation ID is required',
                        timestamp: new Date().toISOString(),
                        requestId: req.headers['x-request-id'],
                    };
                    res.status(400).json(response);
                    return;
                }
                const quotation = await this.quotationService.sendQuotation(id);
                const response = {
                    success: true,
                    message: 'Quotation sent successfully',
                    data: quotation,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.calculateCost = async (req, res, next) => {
            try {
                const costResult = await this.quotationService.calculateQuotationCost(req.body);
                const response = {
                    success: true,
                    message: 'Cost calculated successfully',
                    data: costResult,
                    timestamp: new Date().toISOString(),
                    requestId: req.headers['x-request-id'],
                };
                res.status(200).json(response);
            }
            catch (error) {
                next(error);
            }
        };
        this.getQuotationStatistics = async (req, res, next) => {
            try {
                const filters = {
                    hallId: req.query.hallId,
                    customerId: req.query.customerId,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                };
                const statistics = await this.quotationService.getQuotationStatistics(filters);
                const response = {
                    success: true,
                    message: 'Quotation statistics retrieved successfully',
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
        this.getCustomerQuotations = async (req, res, next) => {
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
                const result = await this.quotationService.getQuotations(filters, pagination);
                const response = {
                    success: true,
                    message: 'Customer quotations retrieved successfully',
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
        this.getHallQuotations = async (req, res, next) => {
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
                const result = await this.quotationService.getQuotations(filters, pagination);
                const response = {
                    success: true,
                    message: 'Hall quotations retrieved successfully',
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
        this.quotationService = new QuotationService_1.QuotationService();
    }
    static routes() {
        const controller = new QuotationController();
        const express = require('express');
        const router = express.Router();
        router.use(RateLimitMiddleware_1.RateLimitMiddleware.general);
        router.post('/calculate', AuthMiddleware_1.AuthMiddleware.optionalAuth, ErrorHandler_1.ErrorHandler.asyncHandler(controller.calculateCost));
        router.post('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.createQuotation), ErrorHandler_1.ErrorHandler.asyncHandler(controller.createQuotation));
        router.get('/', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getQuotations));
        router.get('/my-quotations', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireCustomer, ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getCustomerQuotations));
        router.get('/hall/:hallId', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('hallId'), ValidationMiddleware_1.ValidationMiddleware.validatePagination, ErrorHandler_1.ErrorHandler.asyncHandler(controller.getHallQuotations));
        router.get('/statistics', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getQuotationStatistics));
        router.get('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager', 'staff']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.getQuotationById));
        router.get('/number/:quotationNumber', ErrorHandler_1.ErrorHandler.asyncHandler(controller.getQuotationByNumber));
        router.put('/:id', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ValidationMiddleware_1.ValidationMiddleware.validateBody(ValidationMiddleware_1.ValidationSchemas.updateQuotation), ErrorHandler_1.ErrorHandler.asyncHandler(controller.updateQuotation));
        router.post('/:id/send', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.sendQuotation));
        router.post('/:id/accept', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.acceptQuotation));
        router.post('/:id/reject', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['customer', 'admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.rejectQuotation));
        router.post('/:id/expire', AuthMiddleware_1.AuthMiddleware.verifyToken, AuthMiddleware_1.AuthMiddleware.requireRole(['admin', 'manager']), ValidationMiddleware_1.ValidationMiddleware.validateUuid('id'), ErrorHandler_1.ErrorHandler.asyncHandler(controller.expireQuotation));
        return router;
    }
}
exports.QuotationController = QuotationController;
exports.default = QuotationController;
//# sourceMappingURL=QuotationController.js.map