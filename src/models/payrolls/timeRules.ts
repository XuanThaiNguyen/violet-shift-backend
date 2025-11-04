import { number } from "joi";
import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITimeRule extends Document {
  name: string;
  fromTime: string;
  toTime: string;
  days: string[];
  rate: number;
  priority: number;
  effectiveDate: Date;
  isActive: boolean;
}

const TimeRuleSchema: Schema<ITimeRule> = new Schema<ITimeRule>(
  {
    name: {
      required: true,
      type: String,
      trim: true,
      index: true,
    },
    fromTime: {
      required: true,
      type: String,
      validate: {
        validator: (value) => {
          return value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
        },
        message: "Invalid time format",
      },
      trim: true,
    },
    toTime: {
      required: true,
      type: String,
      validate: {
        validator: (value) => {
          return value.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
        },
        message: "Invalid time format",
      },
    },
    days: {
      required: true,
      type: [Number],
      validate: {
        validator: (value) => {
          return value.every((day: number) => day >= 0 && day <= 6);
        },
        message: "Invalid days format",
      },
    },
    rate: {
      required: true,
      type: Number,
      min: 0,
    },
    priority: {
      required: true,
      type: Number,
    },
    effectiveDate: {
      required: true,
      type: Date,
      default: new Date(),
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

export const TimeRule: Model<ITimeRule> = mongoose.model<ITimeRule>("Time_Rule", TimeRuleSchema);

export default TimeRule;
