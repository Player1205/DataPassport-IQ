import { ethers, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("\n══════════════════════════════════════════════");
  console.log("  DataPassport – DatasetRegistry Deployment");
  console.log("══════════════════════════════════════════════");
  console.log(`  Network : ${network.name} (chainId ${network.config.chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`  Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`  Balance : ${ethers.formatEther(balance)} SHM`);

  if (balance === 0n) {
    throw new Error(
      "Deployer balance is 0. Fund the address from the Shardeum faucet:\n" +
      "  https://faucet-sphinx.shardeum.org/"
    );
  }

  console.log("\n  Deploying DatasetRegistry…");
  const Factory = await ethers.getContractFactory("DatasetRegistry");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const deployTx = contract.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait(1) : null;

  console.log("\n  ✅  Contract deployed!");
  console.log(`  Address  : ${address}`);
  console.log(`  Tx hash  : ${deployTx?.hash ?? "n/a"}`);
  console.log(`  Block    : ${receipt?.blockNumber ?? "n/a"}`);
  console.log(`  Gas used : ${receipt?.gasUsed?.toString() ?? "n/a"}`);

  // ── Explorer link ──────────────────────────────────────────────────────
  const explorerBase =
    network.name === "shardeum_sphinx"
      ? "https://explorer-sphinx.shardeum.org"
      : network.name === "shardeum_liberty"
      ? "https://explorer-liberty20.shardeum.org"
      : null;

  if (explorerBase) {
    console.log(`  Explorer : ${explorerBase}/contract/${address}`);
  }

  // ── Save deployment info ───────────────────────────────────────────────
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress: address,
    deployer: deployer.address,
    txHash: deployTx?.hash,
    blockNumber: receipt?.blockNumber,
    timestamp: new Date().toISOString(),
  };

  // Write to contracts/deployments/<network>.json
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });

  const outPath = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\n  Deployment info saved → ${outPath}`);

  // ── Update root .env hint ──────────────────────────────────────────────
  console.log("\n  📋  Add these to your backend/.env:");
  console.log(`  CONTRACT_ADDRESS=${address}`);
  console.log(`  CHAIN_RPC_URL=${
    network.name === "shardeum_sphinx"
      ? "https://sphinx.shardeum.org/"
      : "http://127.0.0.1:8545"
  }`);
  console.log("\n══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


// To run this script, use:
//   npx hardhat run --network <network_name> deploy.ts
// Example:
//   npx hardhat run --network shardeum_sphinx deploy.ts