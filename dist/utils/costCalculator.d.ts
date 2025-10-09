import { CostCalculationRequest, CostCalculationResponse, CreateLineItemRequest, EventType } from '@/types';
export declare class CostCalculator {
    static calculateCost(request: CostCalculationRequest): CostCalculationResponse;
    private static calculateBaseHallCost;
    private static processLineItems;
    private static isGuestDependentItem;
    private static applyDynamicPricing;
    private static calculateDuration;
    private static generateCostBreakdown;
    static generateQuotationNumber(): string;
    static calculateDepositAmount(totalAmount: number): number;
    static calculateRefundAmount(totalAmount: number, paidAmount: number, cancellationHours: number, eventDate: Date): number;
    static validateCostRequest(request: CostCalculationRequest): {
        isValid: boolean;
        errors: string[];
    };
    static getDefaultLineItems(eventType: EventType, guestCount: number): CreateLineItemRequest[];
}
export default CostCalculator;
//# sourceMappingURL=costCalculator.d.ts.map