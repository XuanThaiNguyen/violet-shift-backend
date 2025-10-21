import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IClient } from "../clientModel";
import { IShift } from "./shiftModel";
import { IPriceBook } from "../priceBookModel";
import { IFunding } from "../fundingModel";

export interface IClientSchedule extends Document {
  shift: IShift | Types.ObjectId;
  client: IClient | Types.ObjectId;
  priceBook: IPriceBook | Types.ObjectId;
  fund: IFunding | Types.ObjectId;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  repetitiveId: string; // for shift repeat bulk update / deletion

  // soft delete
  isDeleted: boolean;
}

const ClientScheduleSchema: Schema<IClientSchedule> = new Schema<IClientSchedule>(
  {
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
      index: true,
    },
    client: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Client",
      index: true,
    },
    priceBook: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "PriceBook",
      index: true,
    },
    fund: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Funding",
      index: true,
    },
    repetitiveId: {
      type: String,
      trim: true,
      index: true,
    },
    timeFrom: {
      required: true,
      type: Number,
      trim: true,
    },
    timeTo: {
      required: true,
      type: Number,
      trim: true,
    },

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

export const ClientSchedule: Model<IClientSchedule> = mongoose.model<IClientSchedule>(
  "ClientSchedule",
  ClientScheduleSchema,
);

export default ClientSchedule;
