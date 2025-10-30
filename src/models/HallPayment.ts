import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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

const HallPaymentSchema = new Schema<HallPaymentDocument>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'HallBooking', required: true, index: true },
    paymentNumber: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    paymentType: { type: String, required: true },
    paymentMode: { type: String, required: true },
    paymentStatus: { type: String, required: true, default: 'PENDING', index: true },
    transactionId: { type: String },
    reference: { type: String },
    isRefunded: { type: Boolean, default: false },
    refundAmount: { type: Number },
    refundReason: { type: String },
    processedAt: { type: Date },
    refundedAt: { type: Date },
    gatewayResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'hall_payments' }
);

export const HallPaymentModel: Model<HallPaymentDocument> =
  mongoose.models.HallPayment || mongoose.model<HallPaymentDocument>('HallPayment', HallPaymentSchema);

export default HallPaymentModel;


