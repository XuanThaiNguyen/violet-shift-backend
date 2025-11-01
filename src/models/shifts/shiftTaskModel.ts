import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IShift } from "./shiftModel";

export interface IShiftTask extends Document {
  repetitiveId: string; // for shift repeat bulk update / deletion
  shift: IShift | Types.ObjectId;
  name: string;
  description: string;
  isMandatory: boolean;
  isCompleted: boolean;
  completedAt: Date;

  // soft delete
  isDeleted: boolean;
}

export const ShiftTaskSchema: Schema<IShiftTask> = new Schema<IShiftTask>({
  shift: {
    type: Schema.Types.ObjectId,
    ref: "Shift",
    required: true,
  },
  repetitiveId: {
    type: String,
    index: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isMandatory: {
    type: Boolean,
    default: false,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
    default: null,
  },

  // soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export const ShiftTask: Model<IShiftTask> = mongoose.model<IShiftTask>(
  "Shift_Task",
  ShiftTaskSchema,
);

export default ShiftTask;
