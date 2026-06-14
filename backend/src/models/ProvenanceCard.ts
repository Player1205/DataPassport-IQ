import { Schema, model, Document, Types } from "mongoose";

export interface IProvenanceStep {
  _id?: Types.ObjectId;
  action: string;
  actor: string;
  actorAddress?: string;
  timestamp: Date;
  txHash?: string;
  blockNumber?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface IProvenanceCard extends Document {
  _id: Types.ObjectId;
  dataset: Types.ObjectId;
  steps: IProvenanceStep[];
  currentHash: string;
  hashHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ProvenanceStepSchema = new Schema<IProvenanceStep>(
  {
    action: { type: String, required: true },
    actor: { type: String, required: true },
    actorAddress: { type: String, lowercase: true },
    timestamp: { type: Date, default: Date.now },
    txHash: { type: String },
    blockNumber: { type: Number },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: true }
);

const ProvenanceCardSchema = new Schema<IProvenanceCard>(
  {
    dataset: {
      type: Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      unique: true,
      index: true,
    },
    steps: [ProvenanceStepSchema],
    currentHash: { type: String, required: true },
    hashHistory: [{ type: String }],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret["__v"] = undefined;
        ret["id"] = ret["_id"];
        ret["_id"] = undefined;
      },
    },
  }
);

export const ProvenanceCard = model<IProvenanceCard>(
  "ProvenanceCard",
  ProvenanceCardSchema
);
