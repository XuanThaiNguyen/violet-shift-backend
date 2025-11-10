import { number } from "joi";
import mongoose, { Document, Model, Schema } from "mongoose";

export const HOLIDAY_TYPES = ['public', 'bank', 'optional', 'school', 'observance'] as const;
export type HolidayType = (typeof HOLIDAY_TYPES)[number];

export interface IHoliday extends Document {
  name: string;
  date: Date;
  description: string;
  region?: string;
  isActive: boolean;
  type: HolidayType;
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
      unique: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      trim: true,
    },
    isActive: {
      required: true,
      type: Boolean,
      default: true,
    },
    type: {
      required: true,
      type: String,
      enum: HOLIDAY_TYPES,
    },
  },
  {
    timestamps: true,
  },
);

export const Holiday: Model<IHoliday> = mongoose.model<IHoliday>("Holiday", HolidaySchema);

export default Holiday;
