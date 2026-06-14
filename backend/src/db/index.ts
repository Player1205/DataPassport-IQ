// @ts-nocheck
import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

let isConnected = false;

/**
 * Robust MongoDB Connection Utility
 * Increased timeouts to handle university network latency.
 */
export async function connectDB(): Promise<void> {
  if (isConnected) return;

  mongoose.set("strictQuery", true);

  try {
    // 1. Pre-Flight Check: Ensure the URI is actually loaded
    if (!env.MONGODB_URI) {
      logger.error("❌ MONGODB_URI is undefined. Check your .env file!");
      process.exit(1); 
    }

    logger.info("--- ATTEMPTING DATABASE CONNECTION ---");

    // 2. Connect with increased timeouts (10s for Server Selection)
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Increased from 5s to 10s for stability
      socketTimeoutMS: 45000,
      family: 4 // Forces IPv4, which often resolves university network issues
    });

    isConnected = true;
    logger.info(`✅ MongoDB connected successfully.`);

    // 3. Connection Event Listeners
    mongoose.connection.on("disconnected", () => {
      isConnected = false;
      logger.warn("⚠️  MongoDB disconnected.");
    });

    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB error event:", err);
    });

  } catch (err: any) {
    logger.error("❌ MongoDB connection failed.");
    
    // Specific advice for common student errors
    if (err.message.includes("ETIMEDOUT") || err.name === "MongooseServerSelectionError") {
      logger.error("👉 DIAGNOSIS: The database server is reachable but blocked.");
      logger.error("👉 ACTION: Go to MongoDB Atlas -> Network Access -> Add IP -> Allow Access From Anywhere (0.0.0.0/0).");
    }
    
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info("MongoDB disconnected (graceful).");
}

export { mongoose };