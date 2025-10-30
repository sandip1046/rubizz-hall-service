import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CHEQUE' | 'BANK_TRANSFER';
export type EventType = 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'ANNIVERSARY' | 'CONFERENCE' | 'SEMINAR' | 'PARTY' | 'MEETING' | 'OTHER';

export interface HallBookingDocument extends Document {
  hallId: Types.ObjectId | string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventName: string;
  eventType: EventType;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  duration: number;
  guestCount: number;
  baseAmount: number;
  additionalCharges: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  depositAmount?: number | null;
  balanceAmount?: number | null;
  depositPaid: boolean;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode | null;
  isConfirmed: boolean;
  isCancelled: boolean;
  cancellationReason?: string | null;
  confirmedAt?: Date | null;
  cancelledAt?: Date | null;
  specialRequests?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const HallBookingSchema = new Schema<HallBookingDocument>(
  {
    hallId: { type: Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    eventName: { type: String, required: true },
    eventType: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    duration: { type: Number, required: true },
    guestCount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    additionalCharges: { type: Number, required: true },
    discount: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true, index: true },
    depositAmount: { type: Number, default: null },
    balanceAmount: { type: Number, default: null },
    depositPaid: { type: Boolean, default: false },
    status: { type: String, required: true, default: 'PENDING', index: true },
    paymentStatus: { type: String, required: true, default: 'PENDING', index: true },
    paymentMode: { type: String, default: null },
    isConfirmed: { type: Boolean, default: false, index: true },
    isCancelled: { type: Boolean, default: false, index: true },
    cancellationReason: { type: String, default: null },
    confirmedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    specialRequests: { type: String, default: null },
  },
  { timestamps: true, collection: 'hall_bookings' }
);

HallBookingSchema.index({ hallId: 1, startDate: 1, isCancelled: 1 });

export const HallBookingModel: Model<HallBookingDocument> =
  mongoose.models.HallBooking || mongoose.model<HallBookingDocument>('HallBooking', HallBookingSchema);

export default HallBookingModel;


