import mongoose, { Document, Model, Schema } from "mongoose";

export const availabilityTypes = ["available", "unavailable"] as const;
export type AvailabilityType = (typeof availabilityTypes)[number];

export interface IAvailability extends Document {
  type: AvailabilityType;
  from: number;
  to: number;
  note?: string;
  isApproved: boolean;
  isDeleted?: boolean;
}

const AvailabilitySchema: Schema<IAvailability> = new Schema<IAvailability>(
  {
    type: {
      type: String,
      enum: availabilityTypes,
      required: true,
      index: true,
      default: "available",
    },
    from: {
      type: Number,
      required: true,
    },
    to: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Availability: Model<IAvailability> = mongoose.model<IAvailability>(
  "Availability",
  AvailabilitySchema,
);

export default Availability;
