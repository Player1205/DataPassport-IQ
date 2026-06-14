import { ethers } from "ethers";

// ── Chain config ──────────────────────────────────────────────────────────

export const SHARDEUM_SPHINX = {
  chainId: "0x1F92",
  chainName: "Shardeum Sphinx 1.X",
  nativeCurrency: { name: "SHM", symbol: "SHM", decimals: 18 },
  rpcUrls: ["https://sphinx.shardeum.org/"],
  blockExplorerUrls: ["https://explorer-sphinx.shardeum.org/"],
};

export const EXPECTED_CHAIN_ID = 8082;

// ── Contract ABI ──────────────────────────────────────────────────────────

export const REGISTRY_ABI = [
  "function registerDataset(bytes32 datasetHash, string calldata name, string calldata metadataUri, uint8 riskScore) external",
  "function getDataset(bytes32 datasetHash) view returns (address owner, string name, string metadataUri, uint8 riskScore, uint256 timestamp)",
  "function isRegistered(bytes32 datasetHash) view returns (bool)",
  "function getProvenance(bytes32 datasetHash) view returns (tuple(address actor, string action, uint256 timestamp, string notes)[])",
  "function totalDatasets() view returns (uint256)",
];

// ── Types ─────────────────────────────────────────────────────────────────

export interface OnChainDataset {
  owner: string;
  name: string;
  metadataUri: string;
  riskScore: number;
  timestamp: number;
  registered: boolean;
}

export interface AnchorTxResult {
  txHash: string;
  blockNumber: number;
  chainId: number;
}

// ── MetaMask window type ──────────────────────────────────────────────────
// We type ethereum as ethers.Eip1193Provider which is exactly what
// BrowserProvider expects. The extra fields (isMetaMask, on, etc.)
// are intersected so we keep full access without casting to unknown.

interface MetaMaskProvider extends ethers.Eip1193Provider {
  isMetaMask?: boolean;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: MetaMaskProvider;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function isMetaMaskAvailable(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function encodeHashToBytes32(hash: string): string {
  const stripped = hash.startsWith("0x") ? hash.slice(2) : hash;
  return "0x" + stripped.padStart(64, "0");
}

function getContractAddress(): string {
  return (
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
    "0x0000000000000000000000000000000000000000"
  );
}

// ── Provider / signer ─────────────────────────────────────────────────────

export function getBrowserProvider(): ethers.BrowserProvider {
  if (!isMetaMaskAvailable() || !window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install it from https://metamask.io"
    );
  }
  // window.ethereum is now typed as Eip1193Provider — no cast needed
  return new ethers.BrowserProvider(window.ethereum);
}

export async function getSigner(): Promise<ethers.JsonRpcSigner> {
  const provider = getBrowserProvider();
  return provider.getSigner();
}

// ── Wallet connect ────────────────────────────────────────────────────────

export async function connectWallet(): Promise<string> {
  if (!isMetaMaskAvailable() || !window.ethereum) {
    throw new Error("MetaMask not found. Please install the extension.");
  }

  const accounts = (await window.ethereum.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts.length) throw new Error("No accounts returned from MetaMask.");

  await switchToShardeum();
  return accounts[0].toLowerCase();
}

export async function getConnectedAddress(): Promise<string | null> {
  if (!isMetaMaskAvailable() || !window.ethereum) return null;
  try {
    const accounts = (await window.ethereum.request({
      method: "eth_accounts",
    })) as string[];
    return accounts[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function switchToShardeum(): Promise<void> {
  if (!isMetaMaskAvailable() || !window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SHARDEUM_SPHINX.chainId }],
    });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [SHARDEUM_SPHINX],
      });
    } else {
      throw err;
    }
  }
}

export async function getCurrentChainId(): Promise<number> {
  if (!isMetaMaskAvailable() || !window.ethereum) return 0;
  const hex = (await window.ethereum.request({
    method: "eth_chainId",
  })) as string;
  return parseInt(hex, 16);
}

export async function signMessage(
  address: string,
  message: string
): Promise<string> {
  const provider = getBrowserProvider();
  const signer = await provider.getSigner(address);
  return signer.signMessage(message);
}

// ── Contract helpers ──────────────────────────────────────────────────────

function getReadContract(): ethers.Contract {
  const provider = new ethers.JsonRpcProvider(SHARDEUM_SPHINX.rpcUrls[0], {
    chainId: EXPECTED_CHAIN_ID,
    name: "shardeum",
  });
  return new ethers.Contract(getContractAddress(), REGISTRY_ABI, provider);
}

async function getWriteContract(): Promise<ethers.Contract> {
  const signer = await getSigner();
  return new ethers.Contract(getContractAddress(), REGISTRY_ABI, signer);
}

// ── Anchor dataset on-chain ───────────────────────────────────────────────

export async function anchorDatasetOnChain(
  datasetHash: string,
  name: string,
  metadataUri: string,
  riskScore: number
): Promise<AnchorTxResult> {
  const chainId = await getCurrentChainId();
  if (chainId !== EXPECTED_CHAIN_ID) {
    await switchToShardeum();
  }

  const contract = await getWriteContract();
  const hashBytes32 = encodeHashToBytes32(datasetHash);
  const safeRisk = Math.min(100, Math.max(0, Math.round(riskScore)));

  const tx = (await contract["registerDataset"](
    hashBytes32,
    name,
    metadataUri,
    safeRisk
  )) as ethers.ContractTransactionResponse;

  const receipt = await tx.wait(1);
  if (!receipt) throw new Error("Transaction receipt is null");

  return {
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    chainId: EXPECTED_CHAIN_ID,
  };
}

// ── Read dataset from chain ───────────────────────────────────────────────

export async function getDatasetFromChain(
  datasetHash: string
): Promise<OnChainDataset> {
  const contract = getReadContract();
  const hashBytes32 = encodeHashToBytes32(datasetHash);

  const registered = (await contract["isRegistered"](
    hashBytes32
  )) as boolean;

  if (!registered) {
    return {
      owner: "",
      name: "",
      metadataUri: "",
      riskScore: 0,
      timestamp: 0,
      registered: false,
    };
  }

  const result = (await contract["getDataset"](hashBytes32)) as [
    string,
    string,
    string,
    bigint,
    bigint
  ];

  return {
    owner: result[0],
    name: result[1],
    metadataUri: result[2],
    riskScore: Number(result[3]),
    timestamp: Number(result[4]),
    registered: true,
  };
}

// ── Total datasets on chain ───────────────────────────────────────────────

export async function getTotalDatasetsOnChain(): Promise<number> {
  try {
    const contract = getReadContract();
    const total = (await contract["totalDatasets"]()) as bigint;
    return Number(total);
  } catch {
    return 0;
  }
}

// ── MetaMask event listeners ──────────────────────────────────────────────

export function onAccountChanged(
  cb: (addr: string | null) => void
): (() => void) | undefined {
  if (!isMetaMaskAvailable() || !window.ethereum) return undefined;
  const handler = (...args: unknown[]) => {
    const accounts = args[0] as string[];
    cb(accounts[0]?.toLowerCase() ?? null);
  };
  window.ethereum.on("accountsChanged", handler);
  return () => window.ethereum?.removeListener("accountsChanged", handler);
}

export function onChainChanged(
  cb: (chainId: number) => void
): (() => void) | undefined {
  if (!isMetaMaskAvailable() || !window.ethereum) return undefined;
  const handler = (...args: unknown[]) => {
    cb(parseInt(args[0] as string, 16));
  };
  window.ethereum.on("chainChanged", handler);
  return () => window.ethereum?.removeListener("chainChanged", handler);
}
