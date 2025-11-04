import mongoose, { Model, Schema, Types, Document } from "mongoose";
import { IClient } from "../clientModel";
import { IShift } from "./shiftModel";

export const ShiftProgressTypes = [
  "note",
  "feedback",
  "incident",
  "enquiry",
  "mileage",
  "expense",
] as const;

export type ShiftProgressTypesEnum = (typeof ShiftProgressTypes)[number];

export interface IShiftProgress extends Document {
  shiftProgressType: ShiftProgressTypesEnum;
  description: string;
  url?: string[];
  client: Types.ObjectId | IClient;
  shift: Types.ObjectId | IShift;
  metadata?: Record<string, string>;
}

const ShiftProgressSchema: Schema<IShiftProgress> = new Schema<IShiftProgress>(
  {
    shiftProgressType: {
      type: String,
      enum: ShiftProgressTypes,
      trim: true,
      required: true,
    },
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      required: true,
    },
    url: [
      {
        type: String,
        trim: true,
      },
    ],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ShiftProgressSchema.index({ shift: 1, client: 1, shiftProgressType: 1 }, { unique: true });

export const ShiftProgress: Model<IShiftProgress> = mongoose.model<IShiftProgress>(
  "Shift_Progress",
  ShiftProgressSchema,
);

export default ShiftProgress;
