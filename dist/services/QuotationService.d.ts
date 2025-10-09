import { HallQuotation, CreateQuotationRequest, UpdateQuotationRequest, QuotationSearchFilters, PaginationParams, PaginatedResponse, CostCalculationRequest } from '@/types';
export declare class QuotationService {
    private prisma;
    private hallService;
    private bookingService;
    constructor();
    createQuotation(data: CreateQuotationRequest): Promise<HallQuotation>;
    getQuotationById(id: string): Promise<HallQuotation | null>;
    getQuotationByNumber(quotationNumber: string): Promise<HallQuotation | null>;
    getQuotations(filters?: QuotationSearchFilters, pagination?: PaginationParams): Promise<PaginatedResponse<HallQuotation>>;
    updateQuotation(id: string, data: UpdateQuotationRequest): Promise<HallQuotation>;
    acceptQuotation(id: string): Promise<HallQuotation>;
    rejectQuotation(id: string): Promise<HallQuotation>;
    expireQuotation(id: string): Promise<HallQuotation>;
    sendQuotation(id: string): Promise<HallQuotation>;
    calculateQuotationCost(data: CostCalculationRequest): Promise<any>;
    getQuotationStatistics(filters?: {
        hallId?: string;
        customerId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    private clearQuotationCache;
}
export default QuotationService;
//# sourceMappingURL=QuotationService.d.ts.map