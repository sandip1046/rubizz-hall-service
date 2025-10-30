import mongoose, { Schema, Document, Model, Types } from 'mongoose';

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

const HallAvailabilitySchema = new Schema<HallAvailabilityDocument>(
  {
    hallId: { type: Schema.Types.ObjectId, ref: 'Hall', required: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    reason: { type: String },
  },
  { timestamps: true, collection: 'hall_availability' }
);

HallAvailabilitySchema.index({ hallId: 1, date: 1 });

export const HallAvailabilityModel: Model<HallAvailabilityDocument> =
  mongoose.models.HallAvailability || mongoose.model<HallAvailabilityDocument>('HallAvailability', HallAvailabilitySchema);

export default HallAvailabilityModel;


