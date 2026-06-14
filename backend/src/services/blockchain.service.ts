import { ethers } from "ethers";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Minimal ABI matching the real DatasetRegistry.sol contract.
 * The contract uses registerDataset(bytes32, string, string, uint8).
 */
const REGISTRY_ABI = [
  "function registerDataset(bytes32 datasetHash, string name, string metadataUri, uint8 riskScore) external",
  "function isRegistered(bytes32 datasetHash) external view returns (bool)",
];

/**
 * Anchors a data hash to the blockchain via the DatasetRegistry contract.
 * Includes a "Demo Mode" for when no contract is deployed (address is all zeros).
 *
 * @param dataHash - Hex SHA-256 hash of the dataset (without 0x prefix)
 * @param name - Human-readable dataset name (for the contract's name field)
 * @param metadataUri - Optional metadata URI (IPFS/HTTPS)
 * @param riskScore - AI-computed risk score 0-100
 */
export const anchorHash = async (
  dataHash: string,
  name: string = "DataPassport Dataset",
  metadataUri: string = "",
  riskScore: number = 0
) => {
  const rpc = env.CHAIN_RPC_URL;
  const contractAddr = env.CONTRACT_ADDRESS;
  const privateKey = env.BLOCKCHAIN_PRIVATE_KEY;

  // ── STEP 1: DEMO MODE CHECK ──
  // If the address is all zeros, we simulate the anchoring for the demo.
  if (!contractAddr || contractAddr.includes("0000000000000000000000000000000000000000")) {
    logger.info("[Blockchain] 🛠️ Demo Mode Active: Simulating anchor for presentation.");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate a fake but realistic Transaction Hash using crypto
    const { randomBytes } = await import("crypto");
    const fakeTxHash = "0x" + randomBytes(32).toString("hex");

    return {
      success: true,
      hash: fakeTxHash,
      blockNumber: 12456789,
      network: "Base Sepolia (Simulated)"
    };
  }

  // ── STEP 2: REAL ANCHORING LOGIC ──
  if (!privateKey) {
    throw new Error("[Blockchain] BLOCKCHAIN_PRIVATE_KEY is not set. Cannot sign transactions.");
  }

  logger.info(`[Blockchain] Attempting real anchor on ${rpc}...`);
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(privateKey, provider);

  const contract = new ethers.Contract(contractAddr, REGISTRY_ABI, wallet);

  // Convert hex hash string to bytes32
  const hashHex = dataHash.startsWith("0x") ? dataHash : `0x${dataHash}`;
  const hashBytes32 = ethers.zeroPadValue(hashHex, 32);

  // Clamp risk score to uint8 range 0-100
  const clampedRisk = Math.min(100, Math.max(0, Math.round(riskScore)));

  // Call the contract
  const tx = await contract.registerDataset(
    hashBytes32,
    name,
    metadataUri,
    clampedRisk
  );
  const receipt = await tx.wait();

  logger.info(`[Blockchain] ✅ Anchored: tx=${receipt.hash} block=${receipt.blockNumber}`);

  return {
    success: true,
    hash: receipt.hash,
    blockNumber: receipt.blockNumber,
    network: "Base Sepolia"
  };
};