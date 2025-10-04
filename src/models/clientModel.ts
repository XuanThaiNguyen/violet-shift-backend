import mongoose, { Document, Model, Schema } from "mongoose";

export interface IClient extends Document {
  useSalutation: boolean;
  salutation: string;
  firstName: string;
  lastName: string;
  middleName: string;
  displayName: string;
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
  isProspect: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema: Schema<IClient> = new Schema<IClient>(
  {
    useSalutation: {
      type: Boolean,
      default: false,
    },
    salutation: {
      type: String,
      enum: ["Mr", "Mrs", "Miss", "Ms", "Mx", "Doctor", "Them", "They"],
      trim: true,
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
    displayName: {
      type: String,
      trim: true,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "intersex", "non-binary", "unspecified", "other"],
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
      index: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
      index: true,
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
    },
    maritalStatus: {
      type: String,
      enum: ["single", "married", "de-facto", "divorced", "separated", "widowed"],
      trim: true,
    },
    nationality: {
      type: String,
      trim: true,
    },
    languages: {
      type: [String],
    },
    isProspect: {
      type: Boolean,
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
