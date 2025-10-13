import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../userModel";
import { IShift } from "./shiftModel";
import { IClient } from "../clientModel";

export const PaymentMethods = ["default", "cash"] as const;
export type PaymentMethodsEnum = (typeof PaymentMethods)[number];

export interface IStaffSchedule extends Document {
  shift: IShift | Types.ObjectId;
  staff: IUser | Types.ObjectId;
  paymentMethod: PaymentMethodsEnum;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  clientNames: string[];
  // payGroup: string;
}

const StaffScheduleSchema: Schema<IStaffSchedule> = new Schema<IStaffSchedule>(
  {
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
      trim: true,
      index: true,
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
  },
  {
    timestamps: true,
  },
);

export const StaffSchedule: Model<IStaffSchedule> = mongoose.model<IStaffSchedule>(
  "StaffSchedule",
  StaffScheduleSchema,
);

export default StaffSchedule;
