import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { IShiftProgress } from "./shiftProgressModel";
import { IUser } from "../userModel";

export interface IShiftProgressEvent extends Document {
  progress: IShiftProgress | Types.ObjectId;
  shift: Types.ObjectId;
  client: Types.ObjectId;
  action: "created" | "updated";
  changes?: Record<string, any>;
  createdBy: IUser | Types.ObjectId;
  createdAt: Date;
}

const ShiftProgressEventSchema = new Schema<IShiftProgressEvent>(
  {
    progress: { type: Schema.Types.ObjectId, ref: "Shift_Progress", required: true },
    shift: { type: Schema.Types.ObjectId, ref: "Shift", required: true },
    client: { type: Schema.Types.ObjectId, ref: "Client", required: true },
    action: { type: String, enum: ["created", "updated"], required: true },
    changes: { type: Object, default: {} },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const ShiftProgressEvent: Model<IShiftProgressEvent> = mongoose.model(
  "Shift_Progress_Event",
  ShiftProgressEventSchema,
);

export default ShiftProgressEvent;
