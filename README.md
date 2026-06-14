# 🛡️ DataPassport

![Status](https://img.shields.io/badge/Status-Active-brightgreen) ![Web3](https://img.shields.io/badge/Web3-Base_Sepolia-blue) ![Integrity](https://img.shields.io/badge/Security-SHA--256-purple)

## 📋 Project Overview
**DataPassport** is a Web3-powered platform designed to guarantee the integrity, provenance, and immutability of AI training datasets. By anchoring cryptographic hashes of datasets directly to the **Base Sepolia blockchain**, DataPassport creates an immutable "passport" for AI data, ensuring that machine learning models are trained on authentic, untampered information.

---

## 🎯 The Problem: AI Data Poisoning
As Artificial Intelligence systems become deeply integrated into critical infrastructure (healthcare, finance, autonomous driving), the integrity of their training data is paramount. 
* **Data Tampering:** Malicious actors can subtly alter datasets (Data Poisoning) to introduce biases or backdoors into AI models.
* **The Black Box Dilemma:** Once an AI model is trained, it is incredibly difficult to retroactively prove exactly what data was fed into it.
* **Lack of Trust:** Organizations lack a verifiable, decentralized way to prove that their proprietary datasets have not been compromised over time.

## 💡 The Solution: Cryptographic Notarization
DataPassport solves this by acting as a decentralized notary for AI data. It does not store the massive datasets on the blockchain (which would be prohibitively expensive). Instead, it generates a unique cryptographic fingerprint (**SHA-256 hash**) of the dataset and anchors *only that hash* to the blockchain via a smart contract. 

If even a single byte of the original dataset is altered, the resulting hash will change entirely, and the blockchain verification will immediately fail, flagging the data as corrupted.

---

## ✨ Key Features
- **Client-Side Hashing Engine:** Datasets are hashed locally in the browser using the SHA-256 algorithm. This ensures that massive or highly sensitive datasets never need to be uploaded to a central server just to be verified.
- **Base Sepolia Anchoring:** Cost-effective, high-speed, Layer-2 blockchain notarization utilizing the Superchain ecosystem.
- **Immutable Audit Trail:** A transparent, publicly verifiable ledger showing exactly when a dataset was timestamped and who anchored it.
- **One-Click Verification Dashboard:** Users can upload a dataset to the platform to instantly verify if its current hash matches the one permanently anchored on the blockchain.

---

## 🛡️ ArmorIQ Security (Track 1: Secure by Default)
DataPassport actively protects the dataset ingestion pipeline using **ArmorIQ**. 
- **ArmorClaw Interceptor:** Scans incoming datasets in real-time to block embedded exploits, prompt injections, and structural malware signatures *before* they are hashed.
- **Fail-Closed Guardrails:** Any dataset that fails the security scan is immediately blocked, guaranteeing that only safe, verified data ever reaches the Base Sepolia blockchain.
- **Cryptographic Intent Verification:** The ArmorIQ SDK registers and logs every execution intent, providing an immutable audit trail of the pipeline's proactive security measures.

---

## ⚙️ How It Works (The Data Flow)

1. **Dataset Ingestion** ➡️ The data scientist selects a dataset (CSV, JSON, image corpus, etc.).
2. **SHA-256 Hashing** ➡️ The platform's hashing engine computes a unique 256-bit cryptographic hash of the file.
3. **Smart Contract Execution** ➡️ The user signs a Web3 transaction, sending the hash and metadata (name, description, timestamp) to the DataPassport Smart Contract.
4. **Blockchain Anchoring** ➡️ The transaction is mined on the **Base Sepolia network**, permanently etching the hash into the immutable ledger.
5. **Future Verification** ➡️ Before training an AI model, a developer can run the dataset through DataPassport. The system calculates the hash and checks it against the Base blockchain. 
   - *Match:* Data is authentic ✅
   - *Mismatch:* Data has been tampered with ❌

---

## 💻 Tech Stack

### Frontend & Backend (The MERN/Web3 Bridge)
* **Framework:** React / Vite
* **Styling:** Tailwind CSS
* **Backend Runtime:** Node.js + Express
* **Hashing Engine:** Web Crypto API (SHA-256)

### Web3 Infrastructure
* **Blockchain Network:** Base Sepolia (Ethereum L2)
* **Smart Contracts:** Solidity
* **Web3 Integration:** Ethers.js / Viem
* **Dev Console:** Superchain Dev Console

---

## 🏗️ Technical Architecture 

```text
[ Dataset File ] 
       ↓
[ Client-Side SHA-256 Hashing Engine ]  ← Data never leaves the browser
       ↓
[ Generated Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 ]
       ↓
[ Web3 Wallet Signature (MetaMask / Coinbase Wallet) ]
       ↓
[ Smart Contract: storeDataHash(hash, metadata) ]
       ↓
[ 🔗 Anchored to Base Sepolia Blockchain ]