import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import axios from "axios";
import { Dataset } from "../models/Dataset";
import * as aiService from "../services/ai.service";
import * as blockchainService from "../services/blockchain.service";
import * as provenanceService from "../services/provenance.service";
import { AppError } from "../middleware/errorHandler";
import { normalizeAndHash, validateUrl } from "../utils/hash";
import { logger } from "../utils/logger";
import { armorClaw, armorIQ } from "../services/armoriq.service";

// ── Zod Schemas ──────────────────────────────────────────────────────────

/** Schema for the POST /datasets body (manual creation). Whitelists allowed fields. */
const createDatasetSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  url: z.string().url(),
  owner: z.string().min(1).max(200),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  hash: z.string().min(1),
  records: z.number().int().min(0).optional().default(0),
});

/** Schema for the POST /datasets/scan-url body. */
const scanUrlSchema = z.object({
  url: z.string().url("A valid URL is required"),
  name: z.string().min(1).max(200).optional().default("Demo Dataset"),
  description: z.string().max(2000).optional().default("Dataset registered via DataPassport scanner."),
  owner: z.string().min(1).max(200).optional().default("Unknown"),
  ownerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional().default("0x0000000000000000000000000000000000000000"),
});

// ── Helpers ──────────────────────────────────────────────────────────────

/** Validate that a string is a valid Mongoose ObjectId */
function assertObjectId(id: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid dataset ID format.", "INVALID_ID");
  }
}

/**
 * Strip GitHub Gist commit hash from raw URLs so we always store
 * a URL that fetches the LATEST version (needed for tamper detection).
 */
function getLatestUrl(url: string): string {
  const gistCommitPattern = /^(https?:\/\/gist\.githubusercontent\.com\/[^\/]+\/[^\/]+\/raw)\/[a-f0-9]{40,}\/(.+)$/i;
  const match = url.match(gistCommitPattern);
  if (match) {
    logger.info("[Scan] Stripped Gist commit hash from URL");
    return `${match[1]}/${match[2]}`;
  }
  return url;
}

// ── Axios defaults for external fetches ──────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000;
const FETCH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Controllers ──────────────────────────────────────────────────────────

export const listDatasetsCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datasets = await Dataset.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, datasets });
  } catch (err) { next(err); }
};

export const getDatasetCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertObjectId(req.params.id);
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) throw new AppError(404, "Not found", "NOT_FOUND");
    res.status(200).json({ success: true, dataset });
  } catch (err) { next(err); }
};

export const createDatasetCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and whitelist fields – prevents mass-assignment / NoSQL injection
    const validated = createDatasetSchema.parse(req.body);
    await validateUrl(validated.url);
    const newDataset = await Dataset.create({
      ...validated,
      status: "pending_audit",
      anchored: false,
    });
    res.status(201).json({ success: true, dataset: newDataset });
  } catch (err) { next(err); }
};

/**
 * POST /datasets/scan-url
 * Fetches a remote dataset, hashes its content, and registers it.
 */
export const scanUrlCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, name, ownerAddress, owner, description } = scanUrlSchema.parse(req.body);

    // SSRF protection: validate URL scheme + block private IPs
    const safeUrl = await validateUrl(url);

    // Always store the "latest" version of the URL (strip commit pins)
    const cleanUrl = getLatestUrl(safeUrl);

    const liveUrl = cleanUrl.includes("?") ? `${cleanUrl}&t=${Date.now()}` : `${cleanUrl}?t=${Date.now()}`;

    const response = await axios.get(liveUrl, {
      transformResponse: [(d: string) => d],
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: FETCH_MAX_BYTES,
      maxBodyLength: FETCH_MAX_BYTES,
    });

    // Step 2: Implement the ArmorClaw Front-Door Interceptor
    const rawPayload = String(response.data);
    const clawScan = await armorClaw.scan(rawPayload);

    // Step 3: Code the Fail-Closed Security Guardrail
    if (!clawScan.isSafe) {
      // Instead of the missing logSecurityEvent method, we can optionally register an intent of the threat
      await armorIQ.registerIntent(`Blocked threat: ${clawScan.threat}`);
      // Fail Condition: Immediately halt all downstream execution.
      res.status(403).json({
        success: false,
        error: `ArmorIQ Security Guardrail Blocked this Dataset: ${clawScan.threat}`
      });
      return;
    }

    // Step 4: Code the Secure Ingestion & Intent Binding
    const intentId = await armorIQ.registerIntent("register_secure_dataset");

    const datasetHash = normalizeAndHash(response.data);

    // ── Count records in the fetched data ──
    let recordCount = 0;
    try {
      const parsed = typeof response.data === "string" ? JSON.parse(response.data) : response.data;
      if (Array.isArray(parsed)) {
        recordCount = parsed.length;
      } else if (typeof parsed === "object" && parsed !== null) {
        recordCount = 1;
      }
    } catch {
      // Not JSON — try counting non-empty lines (CSV / text)
      const lines = String(response.data).split("\n").filter((l: string) => l.trim());
      recordCount = lines.length > 1 ? lines.length - 1 : 0; // subtract header row
    }

    const dataset = await Dataset.create({
      name,
      description,
      url: cleanUrl,
      hash: datasetHash,
      records: recordCount,
      owner,
      ownerAddress,
      status: "pending_audit",
    });

    // Step 5: Close the Intent (No automatic anchoring per user request)
    await armorIQ.closeIntent(intentId, "pending_anchoring");

    res.status(201).json({ success: true, dataset });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`[Scan Error] ${message}`);
    next(err);
  }
};

export const analyzeDatasetCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertObjectId(req.params.id);
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) throw new AppError(404, "Dataset not found", "NOT_FOUND");

    // Ownership check temporarily removed per user request so anyone can run Deep Audit
    // if (dataset.ownerAddress.toLowerCase() !== req.user?.walletAddress.toLowerCase() && req.user?.role !== "admin") {
    //   throw new AppError(403, "Forbidden", "FORBIDDEN");
    // }

    // SSRF protection on stored URL
    await validateUrl(dataset.url);

    // Fetch the raw dataset content
    const latestUrl = getLatestUrl(dataset.url);
    let response;
    try {
      response = await axios.get(latestUrl, { timeout: 15000 });
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        throw new AppError(404, "External dataset URL returned 404 Not Found. The file may have been deleted or made private.", "NOT_FOUND");
      }
      throw new AppError(400, "Failed to download dataset from external URL.", "BAD_REQUEST");
    }

    const content = response.data;
    const analysis = await aiService.analyzePII(content);
    dataset.riskLevel = analysis.riskLevel;
    dataset.aiSummary = analysis.summary;
    dataset.anomalies = analysis.anomalies;
    dataset.status = "audited";
    await dataset.save();
    res.status(200).json({ success: true, analysis });
  } catch (err) { next(err); }
};

export const anchorDatasetCtrl = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assertObjectId(req.params.id);
    const dataset = await Dataset.findById(req.params.id);
    if (!dataset) throw new AppError(404, "Dataset not found", "NOT_FOUND");

    // Ownership check temporarily removed per user request so anyone can anchor
    // if (dataset.ownerAddress.toLowerCase() !== req.user?.walletAddress.toLowerCase() && req.user?.role !== "admin") {
    //   throw new AppError(403, "Forbidden", "FORBIDDEN");
    // }

    const tx = await blockchainService.anchorHash(
      dataset.hash,
      dataset.name,
      dataset.url,
      dataset.riskScore ?? 0
    );
    dataset.anchored = true;
    dataset.txHash = tx.hash;
    dataset.status = "anchored";
    await dataset.save();
    res.status(200).json({ success: true, txHash: tx.hash });
  } catch (err) { next(err); }
};

export const registerDataset = scanUrlCtrl;