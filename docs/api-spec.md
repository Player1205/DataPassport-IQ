# DataPassport — API Specification

Base URL: `http://localhost:4000/api`

All responses follow the shape:
```json
{ "status": "ok" | "error", "data": {…} | null, "message": "…" }
```

---

## Auth

### GET `/auth/nonce/:address`
Returns a one-time sign message for the wallet.

**Params:** `address` — EVM wallet address (`0x…40hex`)

**Response 200:**
```json
{
  "nonce": "abc123",
  "message": "Welcome to DataPassport!\n\nSign this message to authenticate…\n\nAddress: 0x…\nNonce: abc123"
}
```

---

### POST `/auth/verify`
Verifies signature and issues a JWT.

**Body:**
```json
{ "address": "0x…", "signature": "0x…" }
```

**Response 200:**
```json
{
  "token": "eyJ…",
  "user": {
    "id": "ObjectId",
    "walletAddress": "0x…",
    "role": "owner",
    "organisation": null
  }
}
```

**Errors:** `400` invalid signature · `404` address not found

---

### GET `/auth/me`  🔒
**Headers:** `Authorization: Bearer <token>`

**Response 200:** `{ "user": { … } }`

---

## Datasets

### GET `/datasets`
List all datasets. No auth required.

**Query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default 1) |
| `limit` | number | Per page, max 100 (default 20) |
| `search` | string | Full-text search on name, description, tags |
| `riskLevel` | `low\|medium\|high\|critical` | Filter by risk |
| `anchored` | boolean | Filter anchored/unanchored |
| `ownerAddress` | string | Filter by wallet address |

**Response 200:**
```json
{
  "status": "ok",
  "data": [ { …Dataset } ],
  "pagination": { "page": 1, "limit": 20, "total": 47, "pages": 3 }
}
```

---

### GET `/datasets/:id`
Single dataset with populated provenance card.

**Response 200:**
```json
{
  "status": "ok",
  "data": {
    "id": "ObjectId",
    "name": "ImageNet-Medical-v3",
    "description": "…",
    "version": "3.1.0",
    "tags": ["medical", "imaging"],
    "license": "CC BY-NC 4.0",
    "owner": "HealthAI Labs",
    "ownerAddress": "0x71C7…",
    "records": 284000,
    "size": "48.2 GB",
    "ipfsCid": "bafybei…",
    "hash": "0xb94f…",
    "status": "anchored",
    "riskLevel": "low",
    "riskScore": 12,
    "riskFlags": [],
    "aiAnalysis": "Low risk medical dataset…",
    "txHash": "0x4e8e…",
    "blockNumber": 5832041,
    "chainId": 8082,
    "anchored": true,
    "anchoredAt": "2024-05-20T14:11:00Z",
    "createdAt": "2024-03-15T09:22:00Z",
    "updatedAt": "2024-05-20T14:11:00Z",
    "provenanceCard": {
      "id": "ObjectId",
      "currentHash": "sha256hex",
      "steps": [
        {
          "action": "Dataset Registered",
          "actor": "HealthAI Labs",
          "actorAddress": "0x71C7…",
          "timestamp": "2024-03-15T09:22:00Z",
          "notes": "Initial registration."
        }
      ]
    }
  }
}
```

**Errors:** `404` not found

---

### POST `/datasets`  🔒
Register a new dataset.

**Body:**
```json
{
  "name": "string (required, 2-120 chars)",
  "description": "string (required, min 10 chars)",
  "version": "1.0.0",
  "tags": ["medical", "imaging"],
  "license": "CC BY 4.0",
  "owner": "HealthAI Labs",
  "ownerAddress": "0x71C7…",
  "size": "48.2 GB",
  "records": 284000,
  "ipfsCid": "bafybei…",
  "notes": "IRB approved, sourced from 12 hospitals."
}
```

**Response 201:**
```json
{ "status": "ok", "data": { …Dataset } }
```

**Errors:** `400` validation · `409` hash already registered

---

### POST `/datasets/:id/analyze`  🔒
Run AI risk analysis on a dataset.

**Response 200:**
```json
{
  "status": "ok",
  "data": { …updated Dataset },
  "report": {
    "riskLevel": "medium",
    "riskScore": 47,
    "riskFlags": ["Keyword detected: \"pii\""],
    "summary": "Dataset contains potentially sensitive financial data…",
    "recommendations": [
      "Conduct a full PII audit before sharing externally.",
      "Ensure license compliance for all downstream users."
    ]
  }
}
```

---

### POST `/datasets/:id/anchor`  🔒
Record that the dataset hash has been anchored on-chain.
Called by the frontend after the MetaMask transaction confirms.

**Body:** `{}` (backend uses stored hash + auto-stubs if no private key)

**Response 200:**
```json
{
  "status": "ok",
  "data": { …updated Dataset, anchored: true },
  "anchor": {
    "txHash": "0x4e8e…",
    "blockNumber": 5832041,
    "chainId": 8082,
    "contractAddress": "0x…",
    "stub": false
  }
}
```

**Errors:** `404` not found · `409` already anchored

---

## Verify

### GET `/verify/:hash`
Verify a dataset by its SHA-256 hash (with or without `0x` prefix).

**Response 200 — found:**
```json
{
  "status": "ok",
  "verified": true,
  "dataset": {
    "id": "…",
    "name": "ImageNet-Medical-v3",
    "owner": "HealthAI Labs",
    "ownerAddress": "0x71C7…",
    "hash": "0xb94f…",
    "riskLevel": "low",
    "riskScore": 12,
    "license": "CC BY-NC 4.0",
    "version": "3.1.0",
    "records": 284000,
    "anchored": true,
    "anchoredAt": "2024-05-20T14:11:00Z",
    "txHash": "0x4e8e…",
    "blockNumber": 5832041,
    "chainId": 8082,
    "createdAt": "2024-03-15T09:22:00Z"
  },
  "provenance": {
    "steps": [ { …ProvenanceStep } ],
    "currentHash": "sha256hex"
  }
}
```

**Response 404 — not found:**
```json
{ "status": "not_found", "verified": false, "message": "No dataset found for this hash." }
```

**Errors:** `400` hash too short

---

## Error Shape

All errors return:
```json
{
  "status": "error",
  "code": "NOT_FOUND | VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | DUPLICATE_KEY | INTERNAL_ERROR",
  "message": "Human-readable description"
}
```

Validation errors additionally include:
```json
{ "errors": { "field": ["error message"] } }
```
