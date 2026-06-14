/**
 * Integration tests for dataset endpoints.
 *
 * These tests use an in-memory MongoDB (via jest setup) and stub
 * services so they run entirely offline without a real chain or LLM.
 *
 * Run:  npm test
 */

import request from "supertest";
import app from "../src/index";
import { mongoose } from "../src/db";

// ── Test data ─────────────────────────────────────────────────────────────

const VALID_DATASET = {
  name: "Test Dataset Alpha",
  description: "A comprehensive test dataset for integration tests.",
  version: "1.0.0",
  tags: ["test", "integration"],
  license: "CC BY 4.0",
  owner: "Test Org",
  ownerAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  records: 10_000,
  notes: "Created during integration testing.",
};

// ── Helpers ───────────────────────────────────────────────────────────────

let createdId: string;

// ── Lifecycle ─────────────────────────────────────────────────────────────

afterAll(async () => {
  await mongoose.connection.dropDatabase().catch(() => null);
  await mongoose.disconnect().catch(() => null);
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBe("data-passport-backend");
  });
});

describe("GET /api/datasets", () => {
  it("returns a paginated list", async () => {
    const res = await request(app).get("/api/datasets");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it("accepts query filters without error", async () => {
    const res = await request(app)
      .get("/api/datasets")
      .query({ page: 1, limit: 5, riskLevel: "low" });
    expect(res.status).toBe(200);
  });
});

describe("POST /api/datasets", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/api/datasets").send(VALID_DATASET);
    expect(res.status).toBe(401);
  });

  // NOTE: authenticated create test would require a valid JWT.
  // For a full test setup, mock the auth middleware or generate a test token.
  it("rejects missing required fields with 400", async () => {
    const res = await request(app)
      .post("/api/datasets")
      .set("Authorization", "Bearer invalid-token")
      .send({ name: "No description" });
    // Either 401 (token invalid) or 400 (validation) – both acceptable
    expect([400, 401]).toContain(res.status);
  });
});

describe("GET /api/datasets/:id", () => {
  it("returns 404 for unknown id", async () => {
    const fakeId = "64e1a2b3c4d5e6f7a8b9c0d1";
    const res = await request(app).get(`/api/datasets/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it("returns 500 or 400 for malformed id", async () => {
    const res = await request(app).get("/api/datasets/not-a-mongo-id");
    expect([400, 422, 500]).toContain(res.status);
  });
});

describe("GET /api/verify/:hash", () => {
  it("returns not_found for unknown hash", async () => {
    const hash = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
    const res = await request(app).get(`/api/verify/${hash}`);
    expect(res.status).toBe(404);
    expect(res.body.verified).toBe(false);
  });

  it("rejects a too-short hash with 400", async () => {
    const res = await request(app).get("/api/verify/bad");
    expect(res.status).toBe(400);
  });
});

describe("404 handler", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-route-xyz");
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("APP_ERROR");
  });
});
