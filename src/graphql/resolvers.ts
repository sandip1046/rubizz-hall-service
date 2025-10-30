import { HallService } from '@/services/HallService';
import { BookingService } from '@/services/BookingService';
import { QuotationService } from '@/services/QuotationService';

const hallService = new HallService();
const bookingService = new BookingService();
const quotationService = new QuotationService();

export const resolvers = {
  Query: {
    hall: async (_: any, { id }: { id: string }) => hallService.getHallById(id),
    halls: async (_: any, { filters, pagination }: any) => hallService.getHalls(filters, pagination),
    booking: async (_: any, { id }: { id: string }) => bookingService.getBookingById(id),
    bookings: async (_: any, { pagination }: any) => bookingService.getBookings(undefined, pagination),
    quotation: async (_: any, { id }: { id: string }) => quotationService.getQuotationById(id),
    quotations: async (_: any, { pagination }: any) => quotationService.getQuotations(undefined, pagination),
  },
  Mutation: {
    createHall: async (_: any, { input }: any) => hallService.createHall(input),
    updateHall: async (_: any, { id, input }: any) => hallService.updateHall(id, input),
    deleteHall: async (_: any, { id }: any) => hallService.deleteHall(id),

    createBooking: async (_: any, { input }: any) => bookingService.createBooking(input),
    updateBooking: async (_: any, { id, input }: any) => bookingService.updateBooking(id, input),
    cancelBooking: async (_: any, { id, reason }: any) => bookingService.cancelBooking(id, reason),
    confirmBooking: async (_: any, { id }: any) => bookingService.confirmBooking(id),
    checkInBooking: async (_: any, { id }: any) => bookingService.checkInBooking(id),
    checkOutBooking: async (_: any, { id }: any) => bookingService.checkOutBooking(id),

    createQuotation: async (_: any, { input }: any) => quotationService.createQuotation(input),
    updateQuotation: async (_: any, { id, input }: any) => quotationService.updateQuotation(id, input),
    acceptQuotation: async (_: any, { id }: any) => quotationService.acceptQuotation(id),
    rejectQuotation: async (_: any, { id }: any) => quotationService.rejectQuotation(id),
    expireQuotation: async (_: any, { id }: any) => quotationService.expireQuotation(id),
    sendQuotation: async (_: any, { id }: any) => quotationService.sendQuotation(id),
  },
};


