import { Document, Model, Types } from 'mongoose';
export type EventType = 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'SEMINAR' | 'PARTY' | 'MEETING' | 'OTHER';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export interface HallQuotationDocument extends Document {
    hallId: Types.ObjectId | string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    quotationNumber: string;
    eventName: string;
    eventType: EventType;
    eventDate: Date;
    startTime: string;
    endTime: string;
    guestCount: number;
    baseAmount: number;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    validUntil: Date;
    status: QuotationStatus;
    isAccepted: boolean;
    isExpired: boolean;
    acceptedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HallQuotationModel: Model<HallQuotationDocument>;
export default HallQuotationModel;
//# sourceMappingURL=HallQuotation.d.ts.map