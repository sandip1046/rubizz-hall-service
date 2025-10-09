import { Request, Response, NextFunction } from 'express';
export declare class BookingController {
    private bookingService;
    constructor();
    createBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBookingById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    updateBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    cancelBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    confirmBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    checkInBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    checkOutBooking: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getBookingStatistics: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getCustomerBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    getHallBookings: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    static routes(): any;
}
export default BookingController;
//# sourceMappingURL=BookingController.d.ts.map