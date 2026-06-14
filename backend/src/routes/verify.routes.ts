import { Router } from "express";
import { verifyDatasetHash } from "../controllers/verify.controller";

const router = Router();

// Frontend sends the hash in the URL (GET)
router.get("/:hash", verifyDatasetHash);

// Fallback just in case (POST)
router.post("/", verifyDatasetHash);

export default router;