import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../userModel";

export interface IWorkLog extends Document {
  staff: IUser | Types.ObjectId;
  startedAt: number;
  endedAt: number;
  hours: number;
}

const WorklogSchema: Schema<IWorkLog> = new Schema<IWorkLog>(
  {
    staff: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    startedAt: {
      required: true,
      type: Number,
      trim: true,
    },
    endedAt: {
      required: true,
      type: Number,
      trim: true,
    },
    hours: {
      required: true,
      type: Number,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const WorkLog: Model<IWorkLog> = mongoose.model<IWorkLog>("Work_Log", WorklogSchema);

export default WorkLog;
