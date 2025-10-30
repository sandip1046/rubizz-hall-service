import { Document, Model } from 'mongoose';
export interface HallDocument extends Document {
    name: string;
    description: string | null;
    capacity: number;
    area: number;
    location: string;
    amenities: string[];
    baseRate: number;
    hourlyRate: number | null;
    dailyRate: number | null;
    weekendRate: number | null;
    isActive: boolean;
    isAvailable: boolean;
    images: string[];
    floorPlan: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const HallModel: Model<HallDocument>;
export default HallModel;
//# sourceMappingURL=Hall.d.ts.map