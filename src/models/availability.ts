import mongoose, { Document, Model, Schema } from "mongoose";

export const availabilityTypes = ["available", "unavailable"] as const;
export type AvailabilityType = (typeof availabilityTypes)[number];

export interface IAvailability {
  type: AvailabilityType;
  from: number;
  to: number;
  note?: string;
  isApproved: boolean;
  isDeleted?: boolean;
}

export type IAvailabilityDocument = IAvailability & Document;

const AvailabilitySchema: Schema<IAvailabilityDocument> = new Schema<IAvailabilityDocument>(
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

export const Availability: Model<IAvailabilityDocument> = mongoose.model<IAvailabilityDocument>(
  "Availability",
  AvailabilitySchema,
);

export default Availability;
