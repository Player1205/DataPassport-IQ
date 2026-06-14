export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface Dataset {
  id: string;
  name: string;
  description: string;
  owner: string;
  ownerAddress: string;
  tags: string[];
  license: string;
  size: string;
  records: number;
  version: string;
  hash: string;
  txHash: string;
  blockNumber: number;
  chainId: number;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
  verified: boolean;
  ipfsCid: string;
  provenanceSteps: ProvenanceStep[];
}

export interface ProvenanceStep {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  txHash: string;
  notes: string;
}

export const MOCK_DATASETS: Dataset[] = [
  {
    id: "ds_01HZ3K9X2P4VQNM7R8T",
    name: "ImageNet-Medical-v3",
    description:
      "Curated subset of annotated radiology images for diagnostic ML training. Sourced from 12 partner hospitals with IRB approval.",
    owner: "HealthAI Labs",
    ownerAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    tags: ["medical", "imaging", "radiology", "annotated"],
    license: "CC BY-NC 4.0",
    size: "48.2 GB",
    records: 284_000,
    version: "3.1.0",
    hash: "0xb94f5374fce5edbc8e2a8697c15331677e6ebf0b",
    txHash:
      "0x4e8e0e4f3b2c1a9d7f6e5c4b3a2918d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a29",
    blockNumber: 5_832_041,
    chainId: 8082,
    riskLevel: "low",
    riskScore: 12,
    riskFlags: [],
    createdAt: "2024-03-15T09:22:00Z",
    updatedAt: "2024-05-20T14:11:00Z",
    verified: true,
    ipfsCid: "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
    provenanceSteps: [
      {
        id: "ps_001",
        action: "Dataset Created",
        actor: "HealthAI Labs",
        timestamp: "2024-03-15T09:22:00Z",
        txHash: "0x4e8e...3a29",
        notes: "Initial registration with IRB approval docs attached.",
      },
      {
        id: "ps_002",
        action: "Annotations Added",
        actor: "Radiology Team Alpha",
        timestamp: "2024-04-02T11:45:00Z",
        txHash: "0x1f2e...cd45",
        notes: "284k images fully annotated by board-certified radiologists.",
      },
      {
        id: "ps_003",
        action: "Quality Audit",
        actor: "QualityChain Inc.",
        timestamp: "2024-05-20T14:11:00Z",
        txHash: "0x9a8b...ef12",
        notes: "Third-party audit passed. 99.2% annotation accuracy confirmed.",
      },
    ],
  },
  {
    id: "ds_02HZ3K9X2P4VQNM7R9U",
    name: "FinSentiment-2024",
    description:
      "Financial news sentiment dataset scraped from public sources. Used for NLP model training in trading signal generation.",
    owner: "Quant Dynamics",
    ownerAddress: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
    tags: ["finance", "nlp", "sentiment", "trading"],
    license: "Proprietary",
    size: "3.8 GB",
    records: 1_200_000,
    version: "1.4.2",
    hash: "0xa87ff679a2f3e71d9181a67b7542122c04521703",
    txHash:
      "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    blockNumber: 5_901_337,
    chainId: 8082,
    riskLevel: "medium",
    riskScore: 47,
    riskFlags: ["Scraping TOS unclear", "PII in metadata possible"],
    createdAt: "2024-01-10T07:30:00Z",
    updatedAt: "2024-06-01T18:00:00Z",
    verified: true,
    ipfsCid: "bafkreihdwdcefgh4dqkjv67uieovzsvci3m3bgd5chr6bf4p6lmlwpqhjm",
    provenanceSteps: [
      {
        id: "ps_004",
        action: "Dataset Created",
        actor: "Quant Dynamics",
        timestamp: "2024-01-10T07:30:00Z",
        txHash: "0x7c8d...b7c8",
        notes: "Scraped from 32 public financial news APIs.",
      },
      {
        id: "ps_005",
        action: "Sentiment Labels Applied",
        actor: "ML Pipeline v2.1",
        timestamp: "2024-03-22T10:00:00Z",
        txHash: "0x3f4g...de78",
        notes: "Automated labeling via FinBERT. Human review on 5% sample.",
      },
    ],
  },
  {
    id: "ds_03HZ3K9X2P4VQNM7S0V",
    name: "DriveSim-Urban-9K",
    description:
      "Synthetic urban driving simulation dataset. High-fidelity LIDAR + RGB camera captures from Carla simulator.",
    owner: "AutonomousCo",
    ownerAddress: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    tags: ["autonomous", "lidar", "synthetic", "driving"],
    license: "Apache 2.0",
    size: "312 GB",
    records: 9_400,
    version: "2.0.0",
    hash: "0xe4da3b7fbbce2345d7772b0674a318d5",
    txHash:
      "0xab12cd34ef56ab78cd90ef12ab34cd56ef78ab90cd12ef34ab56cd78ef90ab12",
    blockNumber: 5_967_820,
    chainId: 8082,
    riskLevel: "low",
    riskScore: 8,
    riskFlags: [],
    createdAt: "2024-02-28T12:00:00Z",
    updatedAt: "2024-02-28T12:00:00Z",
    verified: true,
    ipfsCid: "bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq",
    provenanceSteps: [
      {
        id: "ps_006",
        action: "Dataset Created",
        actor: "AutonomousCo",
        timestamp: "2024-02-28T12:00:00Z",
        txHash: "0xab12...b12",
        notes: "Fully synthetic. No real-world PII. CARLA v0.9.14.",
      },
    ],
  },
  {
    id: "ds_04HZ3K9X2P4VQNM7S1W",
    name: "SocialBias-Corpus",
    description:
      "Large corpus of social media text curated for bias detection research. Contains real user posts.",
    owner: "FairML Foundation",
    ownerAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    tags: ["nlp", "bias", "social-media", "research"],
    license: "CC BY 4.0",
    size: "22.1 GB",
    records: 5_600_000,
    version: "1.0.0",
    hash: "0x1679091c5a880faf6fb5e6087eb1b2dc",
    txHash:
      "0xcc44bb33aa22ff11ee00dd99cc88bb77aa66ff55ee44dd33cc22bb11aa00ff99",
    blockNumber: 5_814_209,
    chainId: 8082,
    riskLevel: "high",
    riskScore: 74,
    riskFlags: [
      "Real user data",
      "Potential PII exposure",
      "Sensitive content",
    ],
    createdAt: "2023-11-05T15:00:00Z",
    updatedAt: "2024-04-14T09:20:00Z",
    verified: false,
    ipfsCid: "bafybeif2fdfqe3hjtzzmhnkho3ahljgel3qnbj4elf2fkijh3dstmkpvnu",
    provenanceSteps: [
      {
        id: "ps_007",
        action: "Dataset Created",
        actor: "FairML Foundation",
        timestamp: "2023-11-05T15:00:00Z",
        txHash: "0xcc44...ff99",
        notes: "Aggregated from Twitter, Reddit via official APIs.",
      },
      {
        id: "ps_008",
        action: "PII Scrubbing (Partial)",
        actor: "Privacy Tool v1.2",
        timestamp: "2024-04-14T09:20:00Z",
        txHash: "0x5566...aa11",
        notes:
          "Usernames hashed. Full PII audit pending — flagged for review.",
      },
    ],
  },
  {
    id: "ds_05HZ3K9X2P4VQNM7S2X",
    name: "DeepFake-Detect-v1",
    description:
      "Adversarial media dataset for deepfake detection model training. Includes synthetic faces and manipulated audio.",
    owner: "TrustMedia AI",
    ownerAddress: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    tags: ["deepfake", "detection", "adversarial", "media"],
    license: "Research Only",
    size: "89.7 GB",
    records: 450_000,
    version: "1.2.1",
    hash: "0x8277e0910d750195b448797616e091bd",
    txHash:
      "0xdd55ee66ff77aa88bb99cc00dd11ee22ff33aa44bb55cc66dd77ee88ff99aa00",
    blockNumber: 5_999_001,
    chainId: 8082,
    riskLevel: "critical",
    riskScore: 91,
    riskFlags: [
      "Synthetic biometric data",
      "Misuse risk: CSAM adjacent",
      "Export controlled",
    ],
    createdAt: "2024-06-01T00:00:00Z",
    updatedAt: "2024-06-01T00:00:00Z",
    verified: true,
    ipfsCid: "bafkreiefnkigvjgbgpzoqkstszmsplxjxdolkiiqeamoipfxzmglhbphfm",
    provenanceSteps: [
      {
        id: "ps_009",
        action: "Dataset Created",
        actor: "TrustMedia AI",
        timestamp: "2024-06-01T00:00:00Z",
        txHash: "0xdd55...aa00",
        notes:
          "All synthetic faces generated via GAN. No real identities used.",
      },
    ],
  },
];
