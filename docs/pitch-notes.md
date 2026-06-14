# DataPassport — Pitch Notes

## One-liner
> DataPassport gives every AI training dataset an immutable identity — on-chain provenance, AI-powered risk scoring, and tamper-proof certification on Shardeum.

---

## The Problem

AI models are only as trustworthy as the data they're trained on. Yet today:

- **No standard way to verify** where a dataset came from or who touched it
- **No audit trail** when datasets are modified, re-licensed, or misused
- **No risk signal** for downstream users: Does this data contain PII? Was consent obtained?
- Researchers and regulators have **no way to inspect** the provenance of a model's training data

This is a governance gap at the heart of responsible AI.

---

## The Solution

DataPassport creates an on-chain passport for every AI training dataset:

1. **Register** — compute a SHA-256 fingerprint of the dataset metadata and store it on Shardeum
2. **Analyse** — run AI-powered risk scoring (PII exposure, license conflicts, misuse potential)
3. **Anchor** — write the hash + risk score to the `DatasetRegistry` smart contract permanently
4. **Verify** — anyone can check any hash against the registry in seconds

The result is a tamper-evident, publicly auditable chain of custody — from initial registration through every annotation, update, or transfer.

---

## Why Shardeum?

- **Linear scaling** — transaction fees stay flat as the network grows, critical for registering many datasets at low cost
- **EVM compatible** — standard Solidity + ethers.js, zero learning curve
- **Decentralised** — no single point of failure for audit records
- **Fast finality** — 1-block confirmation (~2-5s) gives a snappy UX

---

## Key Technical Differentiators

| Feature | How |
|---------|-----|
| Deterministic hashing | SHA-256 over sorted, serialised metadata — same input always produces same hash |
| Tamper-evident provenance | Each provenance step hashes the previous step, forming a Merkle-like chain in MongoDB |
| AI risk scoring | Claude API analyses name, description, license, tags for PII/consent/misuse signals |
| Zero-config fallback | Both AI and blockchain services stub gracefully when keys are absent — demo always works |
| Wallet-based auth | EIP-191 message signing — no passwords, no email, fully self-sovereign |

---

## Demo Flow (5 minutes)

1. **Connect wallet** → MetaMask on Shardeum Sphinx
2. **Dashboard** → show live datasets loaded from MongoDB
3. **Register** → fill form, submit → watch SHA-256 computed, AI analysis run
4. **Detail page** → show provenance card, risk badge, flags
5. **Anchor** → click button, MetaMask pops up, confirm tx → show tx hash + block number
6. **Verify** → paste any hash on the verify page → green "Verified On-Chain" card

---

## Roadmap

- **v1** (hackathon) — Register, analyse, anchor, verify
- **v2** — IPFS integration for full metadata storage; bulk upload CSV
- **v3** — Dataset marketplace with on-chain licensing agreements
- **v4** — Model cards: link trained model to all datasets used in training
- **Enterprise** — Private deployments, custom risk classifiers, regulatory reporting

---

## Team

Built during [Hackathon Name] · [Date]
