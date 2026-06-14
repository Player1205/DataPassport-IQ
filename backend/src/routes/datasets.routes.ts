import { Router } from "express";
import {
  listDatasetsCtrl,
  getDatasetCtrl,
  createDatasetCtrl,
  analyzeDatasetCtrl,
  anchorDatasetCtrl,
  scanUrlCtrl,
} from "../controllers/datasets.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";

const router = Router();

/** GET /api/datasets - List all datasets */
router.get("/", optionalAuth, listDatasetsCtrl);

/** GET /api/datasets/:id - Get specific dataset details */
router.get("/:id", optionalAuth, getDatasetCtrl);

/** POST /api/datasets - Manual dataset creation */
router.post("/", requireAuth, createDatasetCtrl);

/** POST /api/datasets/scan-url - The "Register" button logic */
router.post("/scan-url", requireAuth, scanUrlCtrl);

/** POST /api/datasets/:id/analyze - The "Deep Audit" logic */
router.post("/:id/analyze", requireAuth, analyzeDatasetCtrl);

/** POST /api/datasets/:id/anchor - The "Anchor" logic */
router.post("/:id/anchor", requireAuth, anchorDatasetCtrl);

export default router;