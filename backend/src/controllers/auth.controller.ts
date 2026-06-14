import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { ethers } from "ethers";
import { User } from "../models/User";
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────

const nonceParamSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
});

const verifyBodySchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid EVM address"),
  signature: z.string().min(10),
});

// ── Helpers ──────────────────────────────────────────────────────

function issueJWT(userId: string, address: string, role: string) {
  return jwt.sign(
    { sub: userId, address: address.toLowerCase(), role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

function buildNonceMessage(address: string, nonce: string) {
  return (
    `Welcome to DataPassport!\n\n` +
    `Sign this message to authenticate. This does not cost any gas.\n\n` +
    `Address: ${address}\nNonce: ${nonce}`
  );
}

// ── Controllers ──────────────────────────────────────────────────

/**
 * GET /auth/nonce/:address
 * Returns a one-time nonce for the wallet to sign.
 */
export async function getNonce(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { address } = nonceParamSchema.parse(req.params);
    const lower = address.toLowerCase();

    let user = await User.findOne({ walletAddress: lower });
    if (!user) {
      user = await User.create({
        walletAddress: lower,
        nonce: crypto.randomBytes(32).toString("hex"),
      });
    }

    const message = buildNonceMessage(lower, user.nonce);
    res.json({ nonce: user.nonce, message });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/verify
 * Verifies wallet signature, returns JWT.
 */
export async function verifySignature(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { address, signature } = verifyBodySchema.parse(req.body);
    const lower = address.toLowerCase();

    const user = await User.findOne({ walletAddress: lower });
    if (!user) throw new AppError(404, "Address not registered.", "NOT_FOUND");

    const message = buildNonceMessage(lower, user.nonce);

    // Recover signer from signature
    let recovered: string;
    try {
      recovered = ethers.verifyMessage(message, signature).toLowerCase();
    } catch {
      throw new AppError(400, "Could not recover signer from signature.", "INVALID_SIGNATURE");
    }

    if (recovered !== lower) {
      throw new AppError(401, "Signature does not match address.", "INVALID_SIGNATURE");
    }

    // Rotate nonce (cryptographically secure)
    user.nonce = crypto.randomBytes(32).toString("hex");
    user.lastLogin = new Date();
    await user.save();

    const token = issueJWT(user._id.toString(), lower, user.role);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout  (stateless – client drops the token)
 */
export async function logout(_req: Request, res: Response) {
  res.json({ status: "ok", message: "Logged out." });
}

/**
 * GET /auth/me
 */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHORIZED");
    res.json({ user: req.user.toJSON() });
  } catch (err) {
    next(err);
  }
}
