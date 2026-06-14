import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

/**
 * Usage:
 *   DATASET_HASH=0xabc123... npx hardhat run scripts/verify.ts --network shardeum_sphinx
 *
 * Reads the deployed contract address from deployments/<network>.json
 * and calls getDataset() to verify the hash exists on-chain.
 */

//refined verify.ts with better formatting and error handling

const REGISTRY_ABI = [
  "function getDataset(bytes32 datasetHash) view returns (address owner, string name, string metadataUri, uint8 riskScore, uint256 timestamp)",
  "function isRegistered(bytes32 datasetHash) view returns (bool)",
  "function getProvenance(bytes32 datasetHash) view returns (tuple(address actor, string action, uint256 timestamp, string notes)[])",
  "function totalDatasets() view returns (uint256)",
];

async function main() {
  const rawHash = process.env.DATASET_HASH;
  if (!rawHash) {
    throw new Error("Set DATASET_HASH env var. Example:\n  DATASET_HASH=0xabc... npx hardhat run scripts/verify.ts --network shardeum_sphinx");
  }

  // Load deployment info
  const deploymentsPath = path.join(
    __dirname,
    `../deployments/${network.name}.json`
  );
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      `No deployment found for network "${network.name}". Run deploy.ts first.`
    );
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const contractAddress: string = deployment.contractAddress;

  console.log("\n══════════════════════════════════════════════");
  console.log("  DataPassport – On-Chain Hash Verification");
  console.log("══════════════════════════════════════════════");
  console.log(`  Network  : ${network.name}`);
  console.log(`  Contract : ${contractAddress}`);
  console.log(`  Hash     : ${rawHash}`);

  const [signer] = await ethers.getSigners();
  const contract = new ethers.Contract(contractAddress, REGISTRY_ABI, signer);

  // Pad hash to 32 bytes if needed
  let hashBytes32: string;
  try {
    const stripped = rawHash.startsWith("0x") ? rawHash.slice(2) : rawHash;
    hashBytes32 = "0x" + stripped.padStart(64, "0");
  } catch {
    throw new Error("Invalid hash format.");
  }

  const exists: boolean = await contract.isRegistered(hashBytes32);
  console.log(`\n  Registered: ${exists ? "✅  YES" : "❌  NO"}`);

  if (!exists) {
    console.log("\n══════════════════════════════════════════════\n");
    return;
  }

  const [owner, name, metadataUri, riskScore, timestamp] =
    await contract.getDataset(hashBytes32);

  console.log(`  Owner    : ${owner}`);
  console.log(`  Name     : ${name}`);
  console.log(`  URI      : ${metadataUri}`);
  console.log(`  Risk     : ${riskScore}/100`);
  console.log(`  Reg time : ${new Date(Number(timestamp) * 1000).toISOString()}`);

  const provenance = await contract.getProvenance(hashBytes32);
  console.log(`\n  Provenance steps (${provenance.length}):`);
  for (const [i, step] of provenance.entries()) {
    console.log(
      `    ${i + 1}. [${new Date(Number(step.timestamp) * 1000).toISOString()}] ` +
      `${step.action} by ${step.actor}`
    );
    if (step.notes) console.log(`       Notes: ${step.notes}`);
  }

  const total: bigint = await contract.totalDatasets();
  console.log(`\n  Total datasets in registry: ${total.toString()}`);
  console.log("\n══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
