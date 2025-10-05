import mongoose, { Document, Model, Schema } from "mongoose";

type ClientStatus = "active" | "inactive" | "prospect";
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
  status: ClientStatus;
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
      enum: ["mr", "mrs", "miss", "ms", "mx", "doctor", "them", "they"],
      trim: true,
      required: function () {
        return this.useSalutation === true;
      },
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    displayName: {
      type: String,
      trim: true,
      required: true,
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
