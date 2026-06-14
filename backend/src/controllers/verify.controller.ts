import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { z } from "zod";
import { Dataset } from "../models/Dataset";
import { normalizeAndHash, validateUrl } from "../utils/hash";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// ── Input validation ─────────────────────────────────────────────────────

/** Require a valid-looking SHA-256 hex hash (with or without 0x prefix) */
const hashParamSchema = z.string().regex(
  /^(0x)?[a-fA-F0-9]{64}$/,
  "Hash must be a 64-character hex string (with optional 0x prefix)"
);

// ── Helper ───────────────────────────────────────────────────────────────

/**
 * Strip GitHub Gist commit hash from raw URLs so we always fetch
 * the LATEST version for tamper detection.
 */
function getLatestUrl(url: string): string {
  const gistCommitPattern = /^(https?:\/\/gist\.githubusercontent\.com\/[^\/]+\/[^\/]+\/raw)\/[a-f0-9]{40,}\/(.+)$/i;
  const match = url.match(gistCommitPattern);
  if (match) {
    const stripped = `${match[1]}/${match[2]}`;
    logger.info(`[Verify] Stripped Gist commit hash → ${stripped}`);
    return stripped;
  }
  return url;
}

// ── Axios safety defaults ────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 15_000;
const FETCH_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Controller ───────────────────────────────────────────────────────────

export const verifyDatasetHash = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawHash = (req.params.hash || req.body.hash || "").trim();

    // Validate hash format
    const parseResult = hashParamSchema.safeParse(rawHash);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: "Invalid hash format. Expected a 64-character hex string.",
      });
    }

    // Strip 0x prefix for DB lookup (hashes are stored without prefix)
    const hash = rawHash.replace(/^0x/i, "");
    logger.info(`[Verify] Searching for hash: ${hash}`);

    const dataset = await Dataset.findOne({ hash });
    if (!dataset) {
      return res.status(200).json({
        success: true,
        verified: false,
        message: "No dataset found for this hash in the registry.",
        dataset: null,
      });
    }

    // SSRF protection on the stored URL before fetching
    await validateUrl(dataset.url);

    // Use the latest URL (strip Gist commit pins) so we always fetch current content
    const latestUrl = getLatestUrl(dataset.url);
    const liveUrl = `${latestUrl}${latestUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;

    logger.info(`[Verify] Re-fetching dataset from: ${liveUrl}`);
    const response = await axios.get(liveUrl, {
      transformResponse: [(d: string) => d],
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: FETCH_MAX_BYTES,
      maxBodyLength: FETCH_MAX_BYTES,
    });

    const liveHash = normalizeAndHash(response.data);
    const isVerified = liveHash === dataset.hash;

    logger.info(`[Verify] Stored hash : ${dataset.hash}`);
    logger.info(`[Verify] Live hash   : ${liveHash}`);
    logger.info(`[Verify] Match       : ${isVerified}`);

    res.status(200).json({
      success: true,
      verified: isVerified,
      authentic: isVerified, // keep for backward compat
      message: isVerified
        ? "Authenticity Confirmed"
        : "INTEGRITY BREACH: Dataset content has been modified since registration!",
      dataset,
    });
  } catch (err) { next(err); }
};