import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPriceBookRule extends Document {
  dayOfWeek: string;
  timeFrom: number;
  timeTo: number;
  perHour: number;
  referenceNumberHour: number;
  perKm: number;
  referenceNumberKm: number;
  effectiveDate: Date;
}

//timeFrom, timeTo by minutes
// {
//   12AM: 0,
//   1AM: 60,
//   2AM: 120,
//   3AM: 180,
//   4AM: 240,
//   5AM: 300,
//   6AM: 360,
// }

const PriceBookRuleSchema: Schema<IPriceBookRule> = new Schema<IPriceBookRule>({
  dayOfWeek: {
    type: String,
    enum: ["holidays", "weekdays", "saturday", "sunday"],
    required: true,
  },
  timeFrom: {
    type: Number,
    required: true,
  },
  timeTo: {
    type: Number,
    required: true,
  },
  perHour: {
    type: Number,
    required: true,
  },
  referenceNumberHour: {
    type: Number,
    default: 0,
  },
  perKm: {
    type: Number,
    required: true,
  },
  referenceNumberKm: {
    type: Number,
    default: 0,
  },
  effectiveDate: {
    type: Date,
    required: true,
  },
});

export interface IPriceBook extends Document {
  name: string;
  isArchived: boolean;
  rules: IPriceBookRule[];
}

const PriceBookSchema: Schema<IPriceBook> = new Schema<IPriceBook>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    rules: [PriceBookRuleSchema],
  },
  {
    timestamps: true,
  },
);

export const PriceBook: Model<IPriceBook> = mongoose.model<IPriceBook>(
  "PriceBook",
  PriceBookSchema,
);
