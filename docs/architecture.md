# DataPassport — Architecture

> On-chain provenance, AI risk scoring, and tamper-proof certification for AI training datasets.
> Deployed on **Shardeum Sphinx** testnet (chainId 8082).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User's Browser                               │
│                                                                       │
│   Next.js Frontend (Vercel / localhost:3000)                         │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│   │  Dashboard   │  │  Register    │  │   Verify     │             │
│   │  (live data) │  │  Dataset     │  │   Hash       │             │
│   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│          │  Axios           │  POST            │  GET                │
│          │  /api/datasets   │  /api/datasets   │  /api/verify/:hash  │
└──────────┼──────────────────┼──────────────────┼────────────────────-┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│            Express Backend  (Render / localhost:4000)                │
│                                                                       │
│  ┌──────────┐  ┌───────────────┐  ┌─────────────────────────────┐  │
│  │  Auth    │  │   Datasets    │  │   Services                   │  │
│  │  Routes  │  │   Routes      │  │                              │  │
│  │  /nonce  │  │  GET  /       │  │  dataset.service.ts          │  │
│  │  /verify │  │  GET  /:id    │  │  ├─ create / list / get      │  │
│  │  /me     │  │  POST /       │  │  provenance.service.ts       │  │
│  └──────────┘  │  POST /:id/   │  │  ├─ append steps, hash chain │  │
│                │    analyze    │  │  ai.service.ts               │  │
│                │  POST /:id/   │  │  ├─ Claude API / stub        │  │
│                │    anchor     │  │  blockchain.service.ts       │  │
│                └───────────────┘  │  └─ ethers.js → Shardeum     │  │
│                                   └─────────────────────────────-┘  │
│                                                                       │
│  MongoDB Atlas / localhost:27017                                      │
│  Collections: users · datasets · provenancecards · blockchainrecords │
└──────────────────────────────┬──────────────────────────────────────-┘
                               │  ethers v6 (DEPLOYER_PRIVATE_KEY)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│         Shardeum Sphinx Testnet  (chainId 8082)                      │
│                                                                       │
│   DatasetRegistry.sol                                                 │
│   ├─ registerDataset(bytes32 hash, string name, string uri, uint8 r) │
│   ├─ getDataset(bytes32 hash) → owner, name, uri, riskScore, ts      │
│   ├─ getProvenance(bytes32 hash) → ProvenanceEntry[]                 │
│   └─ isRegistered(bytes32 hash) → bool                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Main Endpoints

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/nonce/:address` | — | Returns a one-time nonce message for the wallet to sign |
| POST | `/api/auth/verify` | — | Verifies EIP-191 signature, returns JWT |
| GET | `/api/auth/me` | JWT | Returns logged-in user profile |
| POST | `/api/auth/logout` | JWT | Stateless logout (client drops token) |

### Datasets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/datasets` | Optional | List all datasets (paginated, filterable) |
| GET | `/api/datasets/:id` | Optional | Single dataset with provenance card |
| POST | `/api/datasets` | **JWT** | Register a new dataset |
| POST | `/api/datasets/:id/analyze` | **JWT** | Run AI risk analysis |
| POST | `/api/datasets/:id/anchor` | **JWT** | Anchor hash on Shardeum |

### Verify

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/verify/:hash` | — | Verify dataset by SHA-256 hash or tx hash |

---

## Core Flows

### 1. Register → Analyse → Anchor → Verify

```
User fills form (name, description, owner, license, tags…)
    │
    ▼
POST /api/datasets
    ├─ Validate fields (Zod)
    ├─ Compute SHA-256 hash of sorted metadata JSON
    ├─ Insert Dataset document → MongoDB
    ├─ Create ProvenanceCard with "Dataset Registered" step
    └─ Return { data: Dataset }
    │
    ▼
POST /api/datasets/:id/analyze
    ├─ Load dataset from MongoDB
    ├─ If LLM_API_KEY set → call Claude API with structured prompt
    │  else → keyword-based risk scorer (stub)
    ├─ Update Dataset.riskLevel, riskScore, riskFlags, aiAnalysis
    ├─ Append "AI Risk Analysis Completed" provenance step
    └─ Return { data: Dataset, report: { riskLevel, riskScore, flags, summary } }
    │
    ▼
User clicks "Anchor on Blockchain" in browser
    │
    ▼
frontend/lib/web3.ts → anchorDatasetOnChain()
    ├─ Ensure MetaMask connected + on Shardeum (chainId 8082)
    ├─ Encode hash to bytes32
    ├─ Contract.registerDataset(bytes32, name, uri, riskScore)
    ├─ Wait 1 block confirmation
    └─ Return { txHash, blockNumber, chainId }
    │
    ▼
POST /api/datasets/:id/anchor (backend notified by frontend)
    ├─ Update Dataset.txHash, blockNumber, chainId, anchored=true
    ├─ Insert BlockchainRecord document
    ├─ Append "Anchored On-Chain" provenance step
    └─ Return { data: Dataset, anchor: { txHash, blockNumber } }
    │
    ▼
GET /api/verify/:hash
    ├─ Normalise hash (add 0x if absent)
    ├─ Find Dataset in MongoDB by hash
    ├─ Cross-check BlockchainRecord table
    ├─ Load ProvenanceCard
    └─ Return { verified: true/false, dataset, provenance }
```

### 2. Wallet Auth Flow

```
User clicks "Connect Wallet"
    │
    ▼
MetaMask → eth_requestAccounts
    │
    ▼
GET /api/auth/nonce/:address
    ├─ Find or create User by wallet address
    └─ Return { nonce, message }
    │
    ▼
signer.signMessage(message)   ← MetaMask signs EIP-191 message
    │
    ▼
POST /api/auth/verify { address, signature }
    ├─ ethers.verifyMessage(message, signature) → recovered address
    ├─ Compare recovered === address
    ├─ Rotate nonce (prevent replay)
    ├─ Issue JWT (sub=userId, address, role)
    └─ Return { token, user }
    │
    ▼
localStorage.setItem("dp_token", token)
Axios interceptor attaches: Authorization: Bearer <token>
```

---

## Data Models

### Dataset (MongoDB)

```json
{
  "id": "ObjectId",
  "name": "string",
  "description": "string",
  "version": "string",
  "tags": ["string"],
  "license": "string",
  "owner": "string",
  "ownerAddress": "0x…",
  "records": 284000,
  "size": "48.2 GB",
  "ipfsCid": "bafybei…",
  "hash": "0xsha256hex…",
  "status": "pending | anchored | rejected",
  "riskLevel": "low | medium | high | critical",
  "riskScore": 0,
  "riskFlags": ["string"],
  "aiAnalysis": "string",
  "txHash": "0x…",
  "blockNumber": 5832041,
  "chainId": 8082,
  "anchored": false,
  "anchoredAt": "ISO date",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

### ProvenanceCard (MongoDB)

```json
{
  "dataset": "ObjectId",
  "currentHash": "sha256hex of all previous steps",
  "hashHistory": ["sha256hex", "…"],
  "steps": [
    {
      "action": "Dataset Registered",
      "actor": "HealthAI Labs",
      "actorAddress": "0x…",
      "timestamp": "ISO date",
      "txHash": "0x… (optional)",
      "blockNumber": 5832041,
      "notes": "string"
    }
  ]
}
```

---

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `MONGODB_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret for signing JWTs |
| `LLM_API_KEY` | backend | Anthropic Claude API key (blank = stub) |
| `CHAIN_RPC_URL` | backend + contracts | Shardeum RPC (default: sphinx.shardeum.org) |
| `CHAIN_ID` | backend | 8082 for Sphinx testnet |
| `CONTRACT_ADDRESS` | backend + frontend | Deployed DatasetRegistry address |
| `DEPLOYER_PRIVATE_KEY` | backend + contracts | Wallet key for on-chain writes (blank = stub) |
| `NEXT_PUBLIC_API_BASE_URL` | frontend | Backend API base URL |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | frontend | Same as CONTRACT_ADDRESS |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, ethers.js v6 |
| Backend | Node.js, Express, TypeScript, Mongoose, Zod, Winston |
| Database | MongoDB (Atlas or local) |
| Blockchain | Solidity 0.8.24, Hardhat, ethers.js v6, Shardeum EVM |
| Auth | Wallet-based EIP-191 signatures + JWT |
| AI | Anthropic Claude API (keyword stub fallback) |
| Deployment | Vercel (frontend), Render / Railway (backend), Atlas (DB) |
