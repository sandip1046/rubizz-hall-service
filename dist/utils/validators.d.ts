import { CreateHallRequest, UpdateHallRequest, CreateBookingRequest, UpdateBookingRequest, CreateQuotationRequest, CreateLineItemRequest, CreatePaymentRequest, CreateAvailabilityRequest } from '@/types';
export declare class Validators {
    static validateCreateHall(data: CreateHallRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdateHall(data: UpdateHallRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateCreateBooking(data: CreateBookingRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateUpdateBooking(data: UpdateBookingRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateCreateQuotation(data: CreateQuotationRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateLineItem(data: CreateLineItemRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateCreatePayment(data: CreatePaymentRequest): {
        isValid: boolean;
        errors: string[];
    };
    static validateCreateAvailability(data: CreateAvailabilityRequest): {
        isValid: boolean;
        errors: string[];
    };
    private static isValidTimeFormat;
    private static isValidTimeRange;
    static isValidUUID(uuid: string): boolean;
    static isValidEmail(email: string): boolean;
    static isValidPhone(phone: string): boolean;
    static sanitizeString(input: string): string;
    static validatePagination(page?: number, limit?: number): {
        isValid: boolean;
        errors: string[];
    };
    static validateDateRange(startDate?: string, endDate?: string): {
        isValid: boolean;
        errors: string[];
    };
}
export default Validators;
//# sourceMappingURL=validators.d.ts.map