import mongoose, { Document, Model, Schema } from "mongoose";

export enum AvailabilityTypeEnum {
  AVAILABLE = "available",
  UNAVAILABLE = "unavailable",
}
export const availabilityTypes = Object.values(AvailabilityTypeEnum);
export type AvailabilityType = (typeof availabilityTypes)[number];

export interface IAvailability {
  staff: mongoose.Types.ObjectId;
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
    staff: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: availabilityTypes,
      required: true,
      index: true,
      default: AvailabilityTypeEnum.AVAILABLE,
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
