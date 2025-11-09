import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { logger } from '@/utils/logger';
import { HallService as HallSvc } from '@/services/HallService';
import BookingSvcClass from '@/services/BookingService';
import QuotationSvcClass from '@/services/QuotationService';
import { config } from '@/config/config';

const PROTO_PATH = path.join(__dirname, 'proto', 'hall.proto');

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const proto = grpc.loadPackageDefinition(packageDef) as any;

export async function startGrpcServer(): Promise<grpc.Server> {
  const server = new grpc.Server();

  const hallService = new HallSvc();
  const bookingService = new BookingSvcClass();
  const quotationService = new QuotationSvcClass();

  server.addService(proto.rubizz.hall.HallService.service, {
    GetHall: async (call: any, callback: any) => {
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
      } catch (e: any) {
        logger.error('gRPC GetHall error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
    ListHalls: async (call: any, callback: any) => {
      try {
        const { page, limit, sortBy, sortOrder } = call.request;
        const res = await hallService.getHalls({}, { page, limit, sortBy, sortOrder });
        callback(null, { data: res.data, page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total });
      } catch (e: any) {
        logger.error('gRPC ListHalls error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
    CreateHall: async (call: any, callback: any) => {
      try {
        const hall = await hallService.createHall(call.request);
        callback(null, hall);
      } catch (e: any) {
        logger.error('gRPC CreateHall error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
    UpdateHall: async (call: any, callback: any) => {
      try {
        if (!call.request.id) {
          return callback({
            code: grpc.status.INVALID_ARGUMENT,
            message: 'Hall ID is required'
          });
        }
        const hall = await hallService.updateHall(call.request.id, call.request);
        callback(null, hall);
      } catch (e: any) {
        logger.error('gRPC UpdateHall error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
  });

  server.addService(proto.rubizz.hall.BookingService.service, {
    GetBooking: async (call: any, callback: any) => {
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
      } catch (e: any) {
        logger.error('gRPC GetBooking error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
    CreateBooking: async (call: any, callback: any) => {
      try {
        const booking = await bookingService.createBooking(call.request);
        callback(null, booking);
      } catch (e: any) {
        logger.error('gRPC CreateBooking error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
  });

  server.addService(proto.rubizz.hall.QuotationService.service, {
    GetQuotation: async (call: any, callback: any) => {
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
      } catch (e: any) {
        logger.error('gRPC GetQuotation error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
    CreateQuotation: async (call: any, callback: any) => {
      try {
        const quotation = await quotationService.createQuotation(call.request);
        callback(null, quotation);
      } catch (e: any) {
        logger.error('gRPC CreateQuotation error', { error: e?.message, stack: e?.stack });
        callback({
          code: grpc.status.INTERNAL,
          message: e?.message || 'Internal server error'
        });
      }
    },
  });

  if (config.grpc.enabled) {
    const port = config.grpc.port;
    const host = config.grpc.host;
    const addr = `${host}:${port}`;
    
    await new Promise<void>((resolve, reject) => {
      server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err: any, boundPort: number) => {
        if (err) {
          logger.error('gRPC server bind failed', { error: err.message, addr });
          return reject(err);
        }
        logger.info('gRPC server started', { addr: `${host}:${boundPort}`, port: boundPort });
        resolve();
      });
    });
    
    server.start();
  } else {
    logger.info('gRPC is disabled, skipping server start');
  }
  
  return server;
}


