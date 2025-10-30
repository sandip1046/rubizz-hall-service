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
        const hall = await hallService.getHallById(call.request.id);
        callback(null, hall || {});
      } catch (e: any) {
        callback(e);
      }
    },
    ListHalls: async (call: any, callback: any) => {
      try {
        const { page, limit, sortBy, sortOrder } = call.request;
        const res = await hallService.getHalls({}, { page, limit, sortBy, sortOrder });
        callback(null, { data: res.data, page: res.pagination.page, limit: res.pagination.limit, total: res.pagination.total });
      } catch (e: any) {
        callback(e);
      }
    },
    CreateHall: async (call: any, callback: any) => {
      try {
        const hall = await hallService.createHall(call.request);
        callback(null, hall);
      } catch (e: any) {
        callback(e);
      }
    },
    UpdateHall: async (call: any, callback: any) => {
      try {
        const hall = await hallService.updateHall(call.request.id, call.request);
        callback(null, hall);
      } catch (e: any) {
        callback(e);
      }
    },
  });

  server.addService(proto.rubizz.hall.BookingService.service, {
    GetBooking: async (call: any, callback: any) => {
      try {
        const booking = await bookingService.getBookingById(call.request.id);
        callback(null, booking || {});
      } catch (e: any) {
        callback(e);
      }
    },
    CreateBooking: async (call: any, callback: any) => {
      try {
        const booking = await bookingService.createBooking(call.request);
        callback(null, booking);
      } catch (e: any) {
        callback(e);
      }
    },
  });

  server.addService(proto.rubizz.hall.QuotationService.service, {
    GetQuotation: async (call: any, callback: any) => {
      try {
        const quotation = await quotationService.getQuotationById(call.request.id);
        callback(null, quotation || {});
      } catch (e: any) {
        callback(e);
      }
    },
    CreateQuotation: async (call: any, callback: any) => {
      try {
        const quotation = await quotationService.createQuotation(call.request);
        callback(null, quotation);
      } catch (e: any) {
        callback(e);
      }
    },
  });

  const port = (process.env.GRPC_PORT || '50051');
  const addr = `0.0.0.0:${port}`;
  await new Promise<void>((resolve, reject) => {
    server.bindAsync(addr, grpc.ServerCredentials.createInsecure(), (err: any, boundPort: number) => {
      if (err) return reject(err);
      logger.info('gRPC server started', { addr: `0.0.0.0:${boundPort}` });
      resolve();
    });
  });
  server.start();
  return server;
}


