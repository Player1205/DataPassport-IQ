// @ts-nocheck
import mongoose, { Schema, Document } from "mongoose";

export interface IDataset extends Document {
  name: string;
  description: string;
  url: string;
  owner: string;
  ownerAddress: string;
  hash: string;
  status: string;
  records: number;
  riskScore: number;
  riskLevel: string;
  // ── NEW FIELDS ──
  aiSummary?: string;
  anomalies?: string[];
  anchored: boolean;
  txHash?: string;
  anchoredAt?: Date;
  createdAt: Date;
}

const DatasetSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
    owner: { type: String, required: true },
    ownerAddress: { type: String, required: true },
    hash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "pending_audit", "audited", "anchored", "failed", "verified"],
      default: "pending_audit",
    },
    records: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    riskLevel: { type: String, default: "low" },
    // ── NEW FIELDS ──
    aiSummary: { type: String, default: "" },
    anomalies: { type: [String], default: [] },
    anchored: { type: Boolean, default: false },
    txHash: { type: String },
    anchoredAt: { type: Date },
  },
  { timestamps: true }
);

export const Dataset = mongoose.model<IDataset>("Dataset", DatasetSchema);