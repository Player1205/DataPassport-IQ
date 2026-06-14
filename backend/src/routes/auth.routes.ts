import { Router } from "express";
import { getNonce, verifySignature, logout, getMe } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

/** GET  /api/auth/nonce/:address */
router.get("/nonce/:address", getNonce);

/** POST /api/auth/verify */
router.post("/verify", verifySignature);

/** POST /api/auth/logout */
router.post("/logout", requireAuth, logout);

/** GET  /api/auth/me */
router.get("/me", requireAuth, getMe);

export default router;
