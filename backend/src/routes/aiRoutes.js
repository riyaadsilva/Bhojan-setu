import { Router } from "express";
import {
  chat,
  getDemandPrediction,
  getRecommendedNGOs,
  suggestCategory,
  validateImage,
} from "../controllers/aiController.js";
import { attachUserIfPresent } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/ai/validate-image — public, called after image upload
router.post("/validate-image", validateImage);

// POST /api/ai/suggest-category — public, called after description entered
router.post("/suggest-category", suggestCategory);

// POST /api/ai/chat — attach user for role-aware replies, but not required
router.post("/chat", attachUserIfPresent, chat);

// GET /api/ai/demand-prediction — public dashboard card
router.get("/demand-prediction", getDemandPrediction);

// POST /api/ai/recommend-ngos — public, frontend passes donation + ngo list
router.post("/recommend-ngos", getRecommendedNGOs);

export default router;
