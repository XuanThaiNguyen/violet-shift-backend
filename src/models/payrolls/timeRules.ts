import mongoose, { Document, Model, Schema } from "mongoose";
import WEEKDAYS, { Weekday } from "../../constants/weekdays";

/**
 * fromTime, toTime by minutes
 * {
 *   12AM: 0,
 *   1AM: 60,
 *   2AM: 120,
 *   3AM: 180,
 *   4AM: 240,
 *   5AM: 300,
 *   6AM: 360,
 * }
 */

export interface ITimeRuleObj {
  _id?: string;
  name: string;
  fromTime: number;
  toTime: number;
  weekdays: Weekday;
  rate: number;
  priority: number;
  effectiveDate: Date;
  isActive: boolean;
}
export type ITimeRule = ITimeRuleObj & Document;

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
      type: Number,
      min: 0,
      max: 1439,
    },
    toTime: {
      required: true,
      type: Number,
      min: 0,
      max: 1439,
    },
    weekdays: {
      required: true,
      type: String,
      enum: WEEKDAYS,
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
