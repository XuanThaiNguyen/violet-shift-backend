import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../userModel";
import { IShift } from "../shifts/shiftModel";

export interface IWorkLog extends Document {
  staff: IUser | Types.ObjectId;
  shift: IShift | Types.ObjectId;
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
    shift: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Shift",
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

WorklogSchema.index({ staff: 1, shift: 1 }, { unique: true });

export default WorkLog;
