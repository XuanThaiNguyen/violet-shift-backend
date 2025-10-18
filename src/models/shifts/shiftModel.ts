import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IClient } from "../clientModel";
import { IShiftRepeat } from "./shiftRepeatModel";
import { IShiftTask } from "./shiftTaskModel";

export const ShiftTypes = [
  "personal_care",
  "board_n_lodging",
  "domestic_assistance",
  "night_shift",
  "on_call",
  "recall_to_work",
  "remote_work",
  "respite_care",
  "sleepover",
  "support_coordination",
  "transport",
  "24_hour_care",
] as const;
export const Allowances = ["expense", "mileage", "sleepover"] as const;
export const ShiftStatus = ["booked", "started", "completed"] as const;

export type AllowancesEnum = (typeof Allowances)[number];
export type ShiftTypesEnum = (typeof ShiftTypes)[number];
export type ShiftStatusEnum = (typeof ShiftStatus)[number];

export interface IShift extends Document {
  // shift information
  shiftType: ShiftTypesEnum;
  additionalShiftTypes: ShiftTypesEnum[];
  allowances: AllowancesEnum[];
  mileageInvoicing: Array<Types.ObjectId | IClient>; // miles
  shiftMileage: number;
  additionalCost: number;
  ignoreStaffCount: boolean;
  confirmationRequired: boolean;
  acceptedDeclinable: boolean;

  // time and location
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  breakTime: number; // minutes
  address: string; // address
  unitNumber: string; // unit/department/door number
  bonus: number; // bonus
  dropOffAddress?: string; // drop off address
  dropOffUnitNumber?: string; // drop off unit/department/door number
  repeat: IShiftRepeat | Types.ObjectId;

  // instruction
  instruction: string; // rich text

  // tasks
  tasks: IShiftTask[];

  // mileage information
  mileageCap: number; // miles
  mileage: number; // miles
  isCompanyVehicle: boolean;

  // clock-out information
  clientClockOutRequired: boolean;
  staffClockOutRequired: boolean;

}

const ShiftSchema: Schema<IShift> = new Schema<IShift>(
  {
    // shift information
    shiftType: {
      type: String,
      enum: ShiftTypes,
      trim: true,
    },
    additionalShiftTypes: {
      type: [String],
      enum: ShiftTypes,
      trim: true,
    },
    allowances: {
      type: [String],
      enum: Allowances,
      trim: true,
    },
    mileageInvoicing: {
      type: [Types.ObjectId],
      ref: "Client",
      trim: true,
    },
    shiftMileage: {
      type: Number,
      trim: true,
    },
    additionalCost: {
      type: Number,
      trim: true,
    },
    ignoreStaffCount: {
      type: Boolean,
      default: false,
    },
    confirmationRequired: {
      type: Boolean,
      default: false,
    },
    acceptedDeclinable: {
      type: Boolean,
      default: false,
    },

    // time and location
    timeFrom: {
      type: Number,
      trim: true,
    },
    timeTo: {
      type: Number,
      trim: true,
    },
    breakTime: {
      type: Number,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    unitNumber: {
      type: String,
      trim: true,
    },
    bonus: {
      type: Number,
      trim: true,
    },
    dropOffAddress: {
      type: String,
      trim: true,
    }, // drop off address
    dropOffUnitNumber: {
      type: String,
      trim: true,
    }, // drop off unit/department/door number
    repeat: {
      type: Types.ObjectId,
      ref: "ShiftRepeat",
    },

    instruction: {
      type: String,
      trim: true,
    },

    // mileage information
    mileageCap: {
      type: Number,
      trim: true,
    }, // miles
    mileage: {
      type: Number,
      trim: true,
    }, // miles
    isCompanyVehicle: {
      type: Boolean,
      default: false,
    },

    // clock-out information
    clientClockOutRequired: {
      type: Boolean,
      default: false,
    },
    staffClockOutRequired: {
      type: Boolean,
      default: false,
    },

  },
  {
    timestamps: true,
  },
);

export const Shift: Model<IShift> = mongoose.model<IShift>("Shift", ShiftSchema);

export default Shift;
