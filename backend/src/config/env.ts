import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ── Insecure default values that must never reach production ──
const INSECURE_JWT_DEFAULTS = [
  "dev-secret-key",
  "replace-with-a-long-random-secret",
  "CHANGE_ME_GENERATE_A_RANDOM_SECRET",
  "",
];

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "4000", 10),
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  LLM_API_KEY: process.env.LLM_API_KEY || "",
  LLM_BASE_URL: process.env.LLM_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  LLM_MODEL: process.env.LLM_MODEL || "gemini-flash-latest",

  CHAIN_RPC_URL: process.env.CHAIN_RPC_URL || "https://sepolia.base.org",
  CHAIN_ID: parseInt(process.env.CHAIN_ID || "84532", 10),
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY || "",

  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

// ── Startup validation ─────────────────────────────────────────
// Fail-fast: refuse to boot with insecure or missing critical secrets.
if (INSECURE_JWT_DEFAULTS.includes(env.JWT_SECRET)) {
  console.error(
    "❌ FATAL: JWT_SECRET is missing or set to an insecure default.\n" +
    "   Generate a strong secret:  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"\n" +
    "   Then set JWT_SECRET in your .env file."
  );
  process.exit(1);
}

if (!env.MONGODB_URI) {
  console.error("❌ FATAL: MONGODB_URI is not set. Check your .env file.");
  process.exit(1);
}