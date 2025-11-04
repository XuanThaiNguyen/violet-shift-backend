import { number } from "joi";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface IHoliday extends Document {
  name: string;
  date: Date;
  description: string;
  isActive: boolean;
}

const HolidaySchema: Schema<IHoliday> = new Schema<IHoliday>(
  {
    name: {
      required: true,
      type: String,
      trim: true,
    },
    date: {
      required: true,
      type: Date,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      required: true,
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Holiday: Model<IHoliday> = mongoose.model<IHoliday>("Holiday", HolidaySchema);

export default Holiday;
