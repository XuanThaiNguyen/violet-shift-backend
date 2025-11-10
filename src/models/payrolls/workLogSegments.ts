import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../userModel";
import { IWorkLog } from "./workLogs";
import { IShift } from "../shifts/shiftModel";
import { ITimeRule } from "./timeRules";

export interface IWorkLogSegment extends Document {
  staff: IUser | Types.ObjectId;
  shift: IShift | Types.ObjectId;
  rule: ITimeRule | Types.ObjectId;
  workLog: IWorkLog | Types.ObjectId;
  startedAt: number;
  endedAt: number;
  hours: number;
}

const WorklogSegmentSchema: Schema<IWorkLogSegment> = new Schema<IWorkLogSegment>(
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
    rule: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Time_Rule",
      index: true,
    },
    workLog: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Work_Log",
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

export const WorkLogSegment: Model<IWorkLogSegment> = mongoose.model<IWorkLogSegment>("Work_Log_Segment", WorklogSegmentSchema);

export default WorklogSegmentSchema;
