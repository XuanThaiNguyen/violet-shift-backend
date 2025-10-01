import mongoose, { Document, Model, Schema } from "mongoose";
import { IRole } from "./roleModel";

export interface IMemberInvitation extends Document {
  email: string;
  role: IRole;
  token: string;
  isAccepted: boolean;
  acceptedAt: Date;
  invitedAt: Date;
}

const MemberInvitationSchema: Schema<IMemberInvitation> =
  new Schema<IMemberInvitation>(
    {
      email: {
        required: true,
        type: String,
        trim: true,
        index: true,
        unique: true,
      },
      role: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
        ref: "Role",
      },
      token: {
        type: String,
        required: true,
        index: true,
      },
      isAccepted: {
        type: Boolean,
        default: false,
      },
      acceptedAt: {
        type: Date,
      },
      invitedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      timestamps: true,
    }
  );

export const MemberInvitation: Model<IMemberInvitation> = mongoose.model<IMemberInvitation>(
  "MemberInvitation",
  MemberInvitationSchema
);

export default MemberInvitation;
