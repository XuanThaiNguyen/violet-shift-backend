import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../userModel";
import { IShift, ShiftTypes, ShiftTypesEnum } from "./shiftModel";

export const PaymentMethods = ["default", "cash"] as const;
export type PaymentMethodsEnum = (typeof PaymentMethods)[number];

export interface IStaffSchedule extends Document {
  shift: IShift | Types.ObjectId;
  staff: IUser | Types.ObjectId;
  paymentMethod: PaymentMethodsEnum;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  clientNames: string[];
  clocksInAt: number; // unix timestamp
  clocksOutAt: number; // unix timestamp

  signature: {
    url: string;
    note?: string;
    createdAt: Date;
  };
  clientSignature: {
    url: string;
    note?: string;
    createdAt: Date;
  };

  // soft delete
  isDeleted: boolean;
}

const SignatureSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const StaffScheduleSchema: Schema<IStaffSchedule> = new Schema<IStaffSchedule>(
  {
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
      trim: true,
      index: true,
      unique: true, // remove after implementing advanced shift
    },
    staff: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      index: true,
    },
    timeFrom: {
      required: true,
      type: Number, // unix timestamp
      trim: true,
    },
    timeTo: {
      required: true,
      type: Number, // unix timestamp
      trim: true,
    },
    paymentMethod: {
      required: true,
      type: String,
      enum: PaymentMethods,
      trim: true,
    },
    clientNames: {
      required: true,
      type: [String],
      trim: true,
    },
    clocksInAt: {
      type: Number, // unix timestamp
      trim: true,
    },
    clocksOutAt: {
      type: Number, // unix timestamp
      trim: true,
    },
    signature: SignatureSchema,
    clientSignature: SignatureSchema,

    // soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

StaffScheduleSchema.index({ shift: 1, staff: 1 }, { unique: true });

export const StaffSchedule: Model<IStaffSchedule> = mongoose.model<IStaffSchedule>(
  "Staff_Schedule",
  StaffScheduleSchema,
);

export default StaffSchedule;
