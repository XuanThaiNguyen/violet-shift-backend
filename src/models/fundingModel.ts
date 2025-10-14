import { Schema, model, Types } from "mongoose";

export interface IFunding extends Document {
  userId: Types.ObjectId;
  name: string;
  startDate: string;
  expireDate: string;
  amount: number;
  balance: number;
  isDefault: string;
}

const FundingSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date },
    expireDate: { type: Date },
    amount: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Funding = model("Funding", FundingSchema);
