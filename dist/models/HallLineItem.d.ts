import { Document, Model, Types } from 'mongoose';
export type LineItemType = 'HALL_RENTAL' | 'CHAIR' | 'TABLE' | 'DECORATION' | 'LIGHTING' | 'AV_EQUIPMENT' | 'CATERING' | 'SECURITY' | 'GENERATOR' | 'CLEANING' | 'PARKING' | 'OTHER';
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
export declare const HallLineItemModel: Model<HallLineItemDocument>;
export default HallLineItemModel;
//# sourceMappingURL=HallLineItem.d.ts.map