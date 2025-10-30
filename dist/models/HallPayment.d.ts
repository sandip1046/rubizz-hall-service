import { Document, Model, Types } from 'mongoose';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CHEQUE' | 'BANK_TRANSFER';
export type PaymentType = 'DEPOSIT' | 'ADVANCE' | 'FULL_PAYMENT' | 'REFUND';
export interface HallPaymentDocument extends Document {
    bookingId: Types.ObjectId | string;
    paymentNumber: string;
    amount: number;
    paymentType: PaymentType;
    paymentMode: PaymentMode;
    paymentStatus: PaymentStatus;
    transactionId?: string;
    reference?: string;
    isRefunded: boolean;
    refundAmount?: number;
    refundReason?: string;
    processedAt?: Date;
    refundedAt?: Date;
    gatewayResponse?: any;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HallPaymentModel: Model<HallPaymentDocument>;
export default HallPaymentModel;
//# sourceMappingURL=HallPayment.d.ts.map