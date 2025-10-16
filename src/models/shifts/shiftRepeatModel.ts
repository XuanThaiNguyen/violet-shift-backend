import mongoose, { Document, Model, Schema } from "mongoose";

export interface IShiftRepeat extends Document {
  pattern: string; // cron pattern [second] [minute] [hour] [day of month] [month] [day of week]
  endDate: number; // unix timestamp
  tz: string; // timezone
}

const ShiftRepeatSchema: Schema<IShiftRepeat> = new Schema<IShiftRepeat>(
  {
    pattern: {
      required: true,
      type: String,
      trim: true,
      index: true,
    },
    endDate: {
      required: true,
      type: Number,
      trim: true,
      index: true,
    },
    tz: {
      required: true,
      type: String,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const ShiftRepeat: Model<IShiftRepeat> = mongoose.model<IShiftRepeat>(
  "ShiftRepeat",
  ShiftRepeatSchema,
);

export default ShiftRepeat;
