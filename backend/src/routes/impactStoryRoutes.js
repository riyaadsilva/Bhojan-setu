import { Router } from "express";
import {
  createImpactStory,
  getImpactStories,
  updateImpactStory,
} from "../controllers/impactStoryController.js";

const router = Router();

router.get("/", getImpactStories);
router.post("/", createImpactStory);
router.patch("/:id", updateImpactStory);

export default router;
