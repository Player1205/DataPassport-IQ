import crypto from "crypto";
import dns from "dns/promises";

/**
 * Compute a hex SHA-256 digest of any string input.
 */
export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Compute SHA-256 of a Buffer (e.g. raw file bytes).
 */
export function sha256Buffer(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/**
 * Deterministic hash of a dataset metadata object.
 * Fields are sorted before serialisation to ensure stability.
 */
export function hashDatasetMetadata(meta: Record<string, unknown>): string {
  const sorted = Object.keys(meta)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = meta[k];
      return acc;
    }, {});
  return sha256(JSON.stringify(sorted));
}

/**
 * Return a "0x"-prefixed hex string (Ethereum style).
 */
export function toEthHex(hash: string): string {
  return hash.startsWith("0x") ? hash : `0x${hash}`;
}

/**
 * Verify that a given hash matches a string input.
 */
export function verifyHash(input: string, expected: string): boolean {
  const computed = sha256(input);
  return crypto.timingSafeEqual(
    Buffer.from(computed, "hex"),
    Buffer.from(expected.replace(/^0x/, ""), "hex")
  );
}

// ── Shared hashing for dataset content (used by scan + verify) ────────

/**
 * Normalize arbitrary data (JSON or text) and produce a SHA-256 hex digest.
 * JSON is re-serialized to strip formatting differences.
 */
export function normalizeAndHash(data: unknown): string {
  if (!data) return "";
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    const cleanString = JSON.stringify(parsed);
    return crypto.createHash("sha256").update(cleanString, "utf8").digest("hex");
  } catch {
    return crypto.createHash("sha256").update(String(data).trim(), "utf8").digest("hex");
  }
}

// ── SSRF-safe URL validation ──────────────────────────────────────────

/** RFC-1918 / loopback / link-local / metadata IP ranges */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // loopback
  /^10\./,                           // RFC-1918
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC-1918
  /^192\.168\./,                     // RFC-1918
  /^169\.254\./,                     // link-local / cloud metadata
  /^0\./,                            // "this" network
  /^::1$/,                           // IPv6 loopback
  /^fc00:/i,                         // IPv6 ULA
  /^fe80:/i,                         // IPv6 link-local
];

/**
 * Validate a user-supplied URL for safe external fetching.
 * Blocks file://, private IPs, and cloud metadata endpoints.
 * Returns the validated URL or throws an Error.
 */
export async function validateUrl(raw: string): Promise<string> {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL format.");
  }

  // Only allow http / https
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`Blocked URL scheme: ${parsed.protocol}`);
  }

  // Resolve hostname to IP and check against blocked ranges
  const hostname = parsed.hostname;

  // Block obvious IP-based bypasses
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error("URLs targeting private/internal networks are not allowed.");
    }
  }

  // DNS resolution check for hostnames
  try {
    const { address } = await dns.lookup(hostname);
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(address)) {
        throw new Error("URL resolves to a private/internal IP address.");
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message.includes("private/internal")) {
        throw err;
      }
      throw new Error(`DNS resolution failed for hostname: ${hostname}`);
    }
    throw err;
  }

  return parsed.toString();
}
