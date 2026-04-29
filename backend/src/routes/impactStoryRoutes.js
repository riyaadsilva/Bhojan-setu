import { Router } from "express";
import {
  createImpactStory,
  getImpactStories,
  updateImpactStory,
} from "../controllers/impactStoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public read — impact stories are displayed on the landing/dashboard
router.get("/", getImpactStories);
// Mutations require authentication
router.post("/", protect, createImpactStory);
router.patch("/:id", protect, updateImpactStory);

export default router;
