import { Document, Model, Types } from 'mongoose';
export interface HallAvailabilityDocument extends Document {
    hallId: Types.ObjectId | string;
    date: Date;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HallAvailabilityModel: Model<HallAvailabilityDocument>;
export default HallAvailabilityModel;
//# sourceMappingURL=HallAvailability.d.ts.map