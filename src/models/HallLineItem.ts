import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type LineItemType =
  | 'HALL_RENTAL'
  | 'CHAIR'
  | 'TABLE'
  | 'DECORATION'
  | 'LIGHTING'
  | 'AV_EQUIPMENT'
  | 'CATERING'
  | 'SECURITY'
  | 'GENERATOR'
  | 'CLEANING'
  | 'PARKING'
  | 'OTHER';

export interface HallLineItemDocument extends Document {
  hallId: Types.ObjectId | string;
  bookingId?: Types.ObjectId | string | null;
  quotationId?: Types.ObjectId | string | null;
  itemType: LineItemType;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const HallLineItemSchema = new Schema<HallLineItemDocument>(
  {
    hallId: { type: Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'HallBooking', default: null },
    quotationId: { type: Schema.Types.ObjectId, ref: 'HallQuotation', default: null },
    itemType: { type: String, required: true },
    itemName: { type: String, required: true },
    description: { type: String, default: null },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
  },
  { timestamps: true, collection: 'hall_line_items' }
);

HallLineItemSchema.index({ quotationId: 1 });
HallLineItemSchema.index({ bookingId: 1 });

export const HallLineItemModel: Model<HallLineItemDocument> =
  mongoose.models.HallLineItem || mongoose.model<HallLineItemDocument>('HallLineItem', HallLineItemSchema);

export default HallLineItemModel;


