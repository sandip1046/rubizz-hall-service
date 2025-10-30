"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGrpcServer = startGrpcServer;
const path_1 = __importDefault(require("path"));
const grpc_js_1 = __importDefault(require("@grpc/grpc-js"));
const proto_loader_1 = __importDefault(require("@grpc/proto-loader"));
const logger_1 = require("@/utils/logger");
const HallService_1 = require("@/services/HallService");
const BookingService_1 = __importDefault(require("@/services/BookingService"));
const QuotationService_1 = __importDefault(require("@/services/QuotationService"));
const PROTO_PATH = path_1.default.join(__dirname, 'proto', 'hall.proto');
const packageDef = proto_loader_1.default.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = grpc_js_1.default.loadPackageDefinition(packageDef);
async function startGrpcServer() {
    const server = new grpc_js_1.default.Server();
    const hallService = new HallService_1.HallService();
    const bookingService = new BookingService_1.default();
    const quotationService = new QuotationService_1.default();
    server.addService(proto.rubizz.hall.HallService.service, {
        GetHall: async (call, callback) => {
            try {
                const hall = await hallService.getHallById(call.request.id);
                callback(null, hall || {});
            }
            catch (e) {
                callback(e);
            }
        },
        ListHalls: async (call, callback) => {
            try {
                const { page, limit, sortBy, sortOrder } = call.request;
                const res = await hallService.getHalls({}, { page, limit, sortBy, sortOrder });
                callback(null, { data: res.data, page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total });
            }
            catch (e) {
                callback(e);
            }
        },
        CreateHall: async (call, callback) => {
            try {
                const hall = await hallService.createHall(call.request);
                callback(null, hall);
            }
            catch (e) {
                callback(e);
            }
        },
        UpdateHall: async (call, callback) => {
            try {
                const hall = await hallService.updateHall(call.request.id, call.request);
                callback(null, hall);
            }
            catch (e) {
                callback(e);
            }
        },
    });
    server.addService(proto.rubizz.hall.BookingService.service, {
        GetBooking: async (call, callback) => {
            try {
                const booking = await bookingService.getBookingById(call.request.id);
                callback(null, booking || {});
            }
            catch (e) {
                callback(e);
            }
        },
        CreateBooking: async (call, callback) => {
            try {
                const booking = await bookingService.createBooking(call.request);
                callback(null, booking);
            }
            catch (e) {
                callback(e);
            }
        },
    });
    server.addService(proto.rubizz.hall.QuotationService.service, {
        GetQuotation: async (call, callback) => {
            try {
                const quotation = await quotationService.getQuotationById(call.request.id);
                callback(null, quotation || {});
            }
            catch (e) {
                callback(e);
            }
        },
        CreateQuotation: async (call, callback) => {
            try {
                const quotation = await quotationService.createQuotation(call.request);
                callback(null, quotation);
            }
            catch (e) {
                callback(e);
            }
        },
    });
    const port = (process.env.GRPC_PORT || '50051');
    const addr = `0.0.0.0:${port}`;
    await new Promise((resolve, reject) => {
        server.bindAsync(addr, grpc_js_1.default.ServerCredentials.createInsecure(), (err, boundPort) => {
            if (err)
                return reject(err);
            logger_1.logger.info('gRPC server started', { addr: `0.0.0.0:${boundPort}` });
            resolve();
        });
    });
    server.start();
    return server;
}
//# sourceMappingURL=server.js.map