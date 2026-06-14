import { Schema, model, Document, Types } from "mongoose";

export type TxStatus = "pending" | "confirmed" | "failed";

export interface IBlockchainRecord extends Document {
  _id: Types.ObjectId;
  dataset: Types.ObjectId;

  txHash: string;
  blockNumber?: number;
  blockHash?: string;
  chainId: number;
  contractAddress: string;
  fromAddress: string;

  datasetHash: string;
  datasetId: string;

  status: TxStatus;
  gasUsed?: string;
  confirmations: number;

  eventData?: Record<string, unknown>;

  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BlockchainRecordSchema = new Schema<IBlockchainRecord>(
  {
    dataset: {
      type: Schema.Types.ObjectId,
      ref: "Dataset",
      required: true,
      index: true,
    },
    txHash: { type: String, required: true, unique: true },
    blockNumber: { type: Number },
    blockHash: { type: String },
    chainId: { type: Number, required: true },
    contractAddress: { type: String, required: true, lowercase: true },
    fromAddress: { type: String, required: true, lowercase: true },

    datasetHash: { type: String, required: true, index: true },
    datasetId: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "failed"],
      default: "pending",
    },
    gasUsed: { type: String },
    confirmations: { type: Number, default: 0 },
    eventData: { type: Schema.Types.Mixed },
    confirmedAt: { type: Date },
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

export const BlockchainRecord = model<IBlockchainRecord>(
  "BlockchainRecord",
  BlockchainRecordSchema
);
