import mongoose, { Document, Model, Schema } from "mongoose";

export interface IRole extends Document {
  name: string;
  description: string;
}

const RoleSchema: Schema<IRole> = new Schema<IRole>(
  {
    name: {
      required: true,
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Role: Model<IRole> = mongoose.model<IRole>("Role", RoleSchema);

export default Role;
