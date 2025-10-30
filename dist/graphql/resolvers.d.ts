export declare const resolvers: {
    Query: {
        hall: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types").Hall | null>;
        halls: (_: any, { filters, pagination }: any) => Promise<import("../types").PaginatedResponse<import("../types").Hall>>;
        booking: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types").HallBooking | null>;
        bookings: (_: any, { pagination }: any) => Promise<import("../types").PaginatedResponse<import("../types").HallBooking>>;
        quotation: (_: any, { id }: {
            id: string;
        }) => Promise<import("../types").HallQuotation | null>;
        quotations: (_: any, { pagination }: any) => Promise<import("../types").PaginatedResponse<import("../types").HallQuotation>>;
    };
    Mutation: {
        createHall: (_: any, { input }: any) => Promise<import("../types").Hall>;
        updateHall: (_: any, { id, input }: any) => Promise<import("../types").Hall>;
        deleteHall: (_: any, { id }: any) => Promise<boolean>;
        createBooking: (_: any, { input }: any) => Promise<import("../types").HallBooking>;
        updateBooking: (_: any, { id, input }: any) => Promise<import("../types").HallBooking>;
        cancelBooking: (_: any, { id, reason }: any) => Promise<import("../types").HallBooking>;
        confirmBooking: (_: any, { id }: any) => Promise<import("../types").HallBooking>;
        checkInBooking: (_: any, { id }: any) => Promise<import("../types").HallBooking>;
        checkOutBooking: (_: any, { id }: any) => Promise<import("../types").HallBooking>;
        createQuotation: (_: any, { input }: any) => Promise<import("../types").HallQuotation>;
        updateQuotation: (_: any, { id, input }: any) => Promise<import("../types").HallQuotation>;
        acceptQuotation: (_: any, { id }: any) => Promise<import("../types").HallQuotation>;
        rejectQuotation: (_: any, { id }: any) => Promise<import("../types").HallQuotation>;
        expireQuotation: (_: any, { id }: any) => Promise<import("../types").HallQuotation>;
        sendQuotation: (_: any, { id }: any) => Promise<import("../types").HallQuotation>;
    };
};
//# sourceMappingURL=resolvers.d.ts.map