import { HallBooking, CreateBookingRequest, UpdateBookingRequest, BookingSearchFilters, PaginationParams, PaginatedResponse } from '@/types';
export declare class BookingService {
    private hallService;
    private redisService;
    constructor();
    createBooking(data: CreateBookingRequest): Promise<HallBooking>;
    getBookingById(id: string): Promise<HallBooking | null>;
    getBookings(filters?: BookingSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<HallBooking>>;
    updateBooking(id: string, data: UpdateBookingRequest): Promise<HallBooking>;
    cancelBooking(id: string, reason: string): Promise<HallBooking>;
    confirmBooking(id: string): Promise<HallBooking>;
    checkInBooking(id: string): Promise<HallBooking>;
    checkOutBooking(id: string): Promise<HallBooking>;
    getBookingStatistics(filters?: {
        hallId?: string;
        customerId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    private calculateBaseAmount;
    private clearBookingCache;
}
export default BookingService;
//# sourceMappingURL=BookingService.d.ts.map