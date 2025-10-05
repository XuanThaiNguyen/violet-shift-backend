import mongoose, { Document, Model, Schema } from "mongoose";
import { IRole } from "./roleModel";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  mobileNumber: string;
  phoneNumber: string;
  employmentType: string;
  address: string;
  email: string;
  password: string;
  gender: string;
  birthdate: Date;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  role: IRole;
  avatar: string;
  salutation: string;
  hasSetProfile: boolean;
}

const UserSchema: Schema<IUser> = new Schema<IUser>(
  {
    avatar: {
      type: String,
      trim: true,
    },
    salutation: {
      type: String,
      trim: true,
      enum: ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Them", "They"],
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    preferredName: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "intersex", "non-binary", "unspecified", "other"],
      trim: true,
    },
    employmentType: {
      type: String,
      enum: ["full_time", "part_time", "contract", "casual", "other"],
      trim: true,
    },
    hasSetProfile: {
      type: Boolean,
      default: false,
    },
    joinedAt: {
      type: Date,
    },
    birthdate: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
    },
    role: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Role",
    },
  },
  {
    timestamps: true,
  },
);

export const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);

export default User;
