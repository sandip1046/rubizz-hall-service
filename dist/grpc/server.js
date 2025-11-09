"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGrpcServer = startGrpcServer;
const path_1 = __importDefault(require("path"));
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const logger_1 = require("@/utils/logger");
const HallService_1 = require("@/services/HallService");
const BookingService_1 = __importDefault(require("@/services/BookingService"));
const QuotationService_1 = __importDefault(require("@/services/QuotationService"));
const config_1 = require("@/config/config");
const PROTO_PATH = path_1.default.join(__dirname, 'proto', 'hall.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDef);
async function startGrpcServer() {
    const server = new grpc.Server();
    const hallService = new HallService_1.HallService();
    const bookingService = new BookingService_1.default();
    const quotationService = new QuotationService_1.default();
    server.addService(proto.rubizz.hall.HallService.service, {
        GetHall: async (call, callback) => {
            try {
                if (!call.request.id) {
                    return callback({
                        code: grpc.status.INVALID_ARGUMENT,
                        message: 'Hall ID is required'
                    });
                }
                const hall = await hallService.getHallById(call.request.id);
                if (!hall) {
                    return callback({
                        code: grpc.status.NOT_FOUND,
                        message: 'Hall not found'
                    });
                }
                callback(null, hall);
            }
            catch (e) {
                logger_1.logger.error('gRPC GetHall error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
        ListHalls: async (call, callback) => {
            try {
                const { page, limit, sortBy, sortOrder } = call.request;
                const res = await hallService.getHalls({}, { page, limit, sortBy, sortOrder });
                callback(null, { data: res.data, page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total });
            }
            catch (e) {
                logger_1.logger.error('gRPC ListHalls error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
        CreateHall: async (call, callback) => {
            try {
                const hall = await hallService.createHall(call.request);
                callback(null, hall);
            }
            catch (e) {
                logger_1.logger.error('gRPC CreateHall error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
        UpdateHall: async (call, callback) => {
            try {
                if (!call.request.id) {
                    return callback({
                        code: grpc.status.INVALID_ARGUMENT,
                        message: 'Hall ID is required'
                    });
                }
                const hall = await hallService.updateHall(call.request.id, call.request);
                callback(null, hall);
            }
            catch (e) {
                logger_1.logger.error('gRPC UpdateHall error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
    });
    server.addService(proto.rubizz.hall.BookingService.service, {
        GetBooking: async (call, callback) => {
            try {
                if (!call.request.id) {
                    return callback({
                        code: grpc.status.INVALID_ARGUMENT,
                        message: 'Booking ID is required'
                    });
                }
                const booking = await bookingService.getBookingById(call.request.id);
                if (!booking) {
                    return callback({
                        code: grpc.status.NOT_FOUND,
                        message: 'Booking not found'
                    });
                }
                callback(null, booking);
            }
            catch (e) {
                logger_1.logger.error('gRPC GetBooking error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
        CreateBooking: async (call, callback) => {
            try {
                const booking = await bookingService.createBooking(call.request);
                callback(null, booking);
            }
            catch (e) {
                logger_1.logger.error('gRPC CreateBooking error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
    });
    server.addService(proto.rubizz.hall.QuotationService.service, {
        GetQuotation: async (call, callback) => {
            try {
                if (!call.request.id) {
                    return callback({
                        code: grpc.status.INVALID_ARGUMENT,
                        message: 'Quotation ID is required'
                    });
                }
                const quotation = await quotationService.getQuotationById(call.request.id);
                if (!quotation) {
                    return callback({
                        code: grpc.status.NOT_FOUND,
                        message: 'Quotation not found'
                    });
                }
                callback(null, quotation);
            }
            catch (e) {
                logger_1.logger.error('gRPC GetQuotation error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
        CreateQuotation: async (call, callback) => {
            try {
                const quotation = await quotationService.createQuotation(call.request);
                callback(null, quotation);
            }
            catch (e) {
                logger_1.logger.error('gRPC CreateQuotation error', { error: e?.message, stack: e?.stack });
                callback({
                    code: grpc.status.INTERNAL,
                    message: e?.message || 'Internal server error'
                });
            }
        },
    });
    if (config_1.config.grpc.enabled) {
        const port = config_1.config.grpc.port;
        const host = config_1.config.grpc.host;
        const addr = `${host}:${port}`;
        await new Promise((resolve, reject) => {
            server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err, boundPort) => {
                if (err) {
                    logger_1.logger.error('gRPC server bind failed', { error: err.message, addr });
                    return reject(err);
                }
                logger_1.logger.info('gRPC server started', { addr: `${host}:${boundPort}`, port: boundPort });
                resolve();
            });
        });
        server.start();
    }
    else {
        logger_1.logger.info('gRPC is disabled, skipping server start');
    }
    return server;
}
//# sourceMappingURL=server.js.map