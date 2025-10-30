import mongoose, { Schema, Document, Model } from 'mongoose';

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

const HallSchema = new Schema<HallDocument>(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    capacity: { type: Number, required: true, index: true },
    area: { type: Number, required: true, default: 0 },
    location: { type: String, required: true, index: true },
    amenities: { type: [String], default: [] },
    baseRate: { type: Number, required: true },
    hourlyRate: { type: Number, default: null },
    dailyRate: { type: Number, default: null },
    weekendRate: { type: Number, default: null },
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true, index: true },
    images: { type: [String], default: [] },
    floorPlan: { type: String, default: null },
  },
  { timestamps: true, collection: 'halls' }
);

HallSchema.index({ name: 1 }, { unique: true, sparse: true });

export const HallModel: Model<HallDocument> =
  mongoose.models.Hall || mongoose.model<HallDocument>('Hall', HallSchema);

export default HallModel;


