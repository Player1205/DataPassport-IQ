import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { logger } from "./utils/logger";
import { connectDB, disconnectDB } from "./db";
import { notFound, errorHandler } from "./middleware/errorHandler";

// Routes
import authRoutes from "./routes/auth.routes";
import datasetsRoutes from "./routes/datasets.routes";
import verifyRoutes from "./routes/verify.routes";

// ── App setup ─────────────────────────────────────────────────────────────

const app = express();

// ── Security & parsing ────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────

if (env.NODE_ENV !== "test") {
  app.use(
    morgan("dev", {
      stream: { write: (msg: string) => logger.http(msg.trim()) },
    })
  );
}

// ── Rate limiting ─────────────────────────────────────────────────────────

const limiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "error", message: "Too many requests." },
});
app.use("/api/", limiter);

// ── Health check ──────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "data-passport-backend",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// ── API routes ────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/datasets", datasetsRoutes);
app.use("/api/verify", verifyRoutes);

// ── 404 + error handling ──────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ── Boot ──────────────────────────────────────────────────────────────────

const PORT = Number(env.PORT);

async function start() {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info(`🚀  DataPassport API running on http://localhost:${PORT}`);
      logger.info(`    ENV      : ${env.NODE_ENV}`);
      logger.info(`    MongoDB  : ${env.MONGODB_URI.replace(/\/\/[^@]+@/, "//***:***@")}`);
      logger.info(`    Chain    : ${env.CHAIN_RPC_URL} (id ${env.CHAIN_ID})`);
      logger.info(`    Contract : ${env.CONTRACT_ADDRESS}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received – shutting down…`);
      server.close(async () => {
        await disconnectDB();
        logger.info("Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    logger.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

export default app;   // exported for tests
