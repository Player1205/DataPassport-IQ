import crypto from "crypto";
import { Schema, model, Document, Types } from "mongoose";

export type UserRole = "admin" | "owner" | "auditor" | "viewer";

export interface IUser extends Document {
  _id: Types.ObjectId;
  walletAddress: string;
  username?: string;
  email?: string;
  role: UserRole;
  organisation?: string;
  nonce: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    username: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ["admin", "owner", "auditor", "viewer"],
      default: "owner",
    },
    organisation: { type: String, trim: true },
    nonce: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(32).toString("hex"),
    },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        // Use undefined assignment instead of delete to satisfy strict TS
        ret["__v"] = undefined;
        ret["id"] = ret["_id"];
        ret["_id"] = undefined;
      },
    },
  }
);

export const User = model<IUser>("User", UserSchema);
