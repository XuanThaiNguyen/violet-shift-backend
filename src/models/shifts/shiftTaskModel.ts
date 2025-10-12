import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IShift } from "./shiftModel";

export interface IShiftTask extends Document {
  shift: IShift | Types.ObjectId;
  name: string;
  description: string;
  isMandatory: boolean;
  isCompleted: boolean;
  completedAt: Date;
}

export const ShiftTaskSchema: Schema<IShiftTask> = new Schema<IShiftTask>({
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
  
});

export const ShiftTask: Model<IShiftTask> = mongoose.model<IShiftTask>("ShiftTask", ShiftTaskSchema);

export default ShiftTask;
