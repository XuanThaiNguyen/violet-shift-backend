import mongoose, { Document, Model, Schema } from "mongoose";

type ClientStatus = "active" | "inactive" | "prospect";
export interface IClient extends Document {
  salutation: string;
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  gender: string;
  email: string;
  birthdate: Date;
  address: string;
  apartmentNumber: string;
  mobileNumber: string;
  phoneNumber: string;
  religion: string;
  maritalStatus: string;
  nationality: string;
  languages: string[];
  status: ClientStatus;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema<IClient>(
  {
    salutation: {
      type: String,
      trim: true,
      enum: ["Mr", "Mrs", "Ms", "Miss", "Mx", "Dr", "Prof", "Them", "They", ""],
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
      enum: ["male", "female", "intersex", "non_binary", "unspecified", "other"],
      trim: true,
    },
    birthdate: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
    },
    apartmentNumber: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
      required: true,
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "de_facto", "divorced", "separated", "widowed"],
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    languages: {
      type: [String],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "prospect"],
      default: "active",
      trim: true,
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const Client: Model<IClient> = mongoose.model<IClient>("Client", ClientSchema);

export default Client;
