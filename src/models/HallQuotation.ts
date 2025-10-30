import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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

const HallQuotationSchema = new Schema<HallQuotationDocument>(
  {
    hallId: { type: Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Customer' },
    customerEmail: { type: String, default: 'customer@example.com' },
    customerPhone: { type: String, default: '+0000000000' },
    quotationNumber: { type: String, required: true, unique: true, index: true },
    eventName: { type: String, required: true },
    eventType: { type: String, required: true },
    eventDate: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    guestCount: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    validUntil: { type: Date, required: true },
    status: { type: String, required: true, default: 'DRAFT', index: true },
    isAccepted: { type: Boolean, default: false },
    isExpired: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'hall_quotations' }
);

HallQuotationSchema.index({ hallId: 1, status: 1 });

export const HallQuotationModel: Model<HallQuotationDocument> =
  mongoose.models.HallQuotation || mongoose.model<HallQuotationDocument>('HallQuotation', HallQuotationSchema);

export default HallQuotationModel;


