"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolvers = void 0;
const HallService_1 = require("@/services/HallService");
const BookingService_1 = require("@/services/BookingService");
const QuotationService_1 = require("@/services/QuotationService");
const hallService = new HallService_1.HallService();
const bookingService = new BookingService_1.BookingService();
const quotationService = new QuotationService_1.QuotationService();
exports.resolvers = {
    Query: {
        hall: async (_, { id }) => hallService.getHallById(id),
        halls: async (_, { filters, pagination }) => hallService.getHalls(filters, pagination),
        booking: async (_, { id }) => bookingService.getBookingById(id),
        bookings: async (_, { pagination }) => bookingService.getBookings(undefined, pagination),
        quotation: async (_, { id }) => quotationService.getQuotationById(id),
        quotations: async (_, { pagination }) => quotationService.getQuotations(undefined, pagination),
    },
    Mutation: {
        createHall: async (_, { input }) => hallService.createHall(input),
        updateHall: async (_, { id, input }) => hallService.updateHall(id, input),
        deleteHall: async (_, { id }) => hallService.deleteHall(id),
        createBooking: async (_, { input }) => bookingService.createBooking(input),
        updateBooking: async (_, { id, input }) => bookingService.updateBooking(id, input),
        cancelBooking: async (_, { id, reason }) => bookingService.cancelBooking(id, reason),
        confirmBooking: async (_, { id }) => bookingService.confirmBooking(id),
        checkInBooking: async (_, { id }) => bookingService.checkInBooking(id),
        checkOutBooking: async (_, { id }) => bookingService.checkOutBooking(id),
        createQuotation: async (_, { input }) => quotationService.createQuotation(input),
        updateQuotation: async (_, { id, input }) => quotationService.updateQuotation(id, input),
        acceptQuotation: async (_, { id }) => quotationService.acceptQuotation(id),
        rejectQuotation: async (_, { id }) => quotationService.rejectQuotation(id),
        expireQuotation: async (_, { id }) => quotationService.expireQuotation(id),
        sendQuotation: async (_, { id }) => quotationService.sendQuotation(id),
    },
};
//# sourceMappingURL=resolvers.js.map