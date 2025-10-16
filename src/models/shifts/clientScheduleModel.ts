import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IClient } from "../clientModel";
import { IShift } from "./shiftModel";

export interface IClientSchedule extends Document {
  shift: IShift | Types.ObjectId;
  client: IClient | Types.ObjectId;
  timeFrom: number; // unix timestamp
  timeTo: number; // unix timestamp
  // priceBook
  // fund
}

const ClientScheduleSchema: Schema<IClientSchedule> = new Schema<IClientSchedule>(
  {
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
      trim: true,
      index: true,
    },
    client: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Client",
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
