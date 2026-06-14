import { Types } from "mongoose";
import { Dataset, IDataset } from "../models/Dataset";

export async function listDatasets(query: Record<string, unknown> = {}) {
  const filter: Record<string, string> = {};
  // Only accept string values – blocks operator injection like { $ne: "" }
  if (typeof query.owner === "string" && query.owner.trim()) {
    filter.owner = query.owner.trim();
  }
  if (typeof query.status === "string" && query.status.trim()) {
    filter.status = query.status.trim();
  }

  const datasets = await Dataset.find(filter).sort({ createdAt: -1 });
  return { data: datasets, total: datasets.length };
}

export async function getDatasetById(id: string) {
  return Dataset.findById(id);
}

export async function getDatasetByHash(hash: string) {
  return Dataset.findOne({ hash });
}

export async function createDataset(dto: Partial<IDataset>) {
  const dataset = new Dataset({
    ...dto,
    status: "pending",
    riskLevel: "medium",
    riskScore: 0,
    anchored: false,
  });
  return dataset.save();
}

export async function updateDatasetRisk(
  id: string,
  riskLevel: string,
  riskScore: number,
  riskFlags: string[],
  aiAnalysis: string,
  license?: string
) {
  return Dataset.findByIdAndUpdate(
    id,
    { riskLevel, riskScore, riskFlags, aiAnalysis, license },
    { new: true }
  );
}

export async function markDatasetAnchored(
  id: string,
  txHash: string,
  blockNumber: number,
  chainId: number
) {
  return Dataset.findByIdAndUpdate(
    id,
    {
      status: "anchored",
      anchored: true,
      anchoredAt: new Date(),
      txHash,
      blockNumber,
      chainId,
    },
    { new: true }
  );
}