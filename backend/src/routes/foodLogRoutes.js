import { Router } from "express";
import { createFoodLog, deleteFoodLog, getFoodLogById, getFoodLogs } from "../controllers/foodLogController.js";
import { attachUserIfPresent, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", attachUserIfPresent, getFoodLogs);
router.post("/", attachUserIfPresent, createFoodLog);
router.get("/:id", getFoodLogById);
// DELETE requires authentication; controller verifies the caller owns the log
router.delete("/:id", protect, deleteFoodLog);

export default router;
