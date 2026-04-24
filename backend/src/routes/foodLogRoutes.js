import { Router } from "express";
import { createFoodLog, deleteFoodLog, getFoodLogById, getFoodLogs } from "../controllers/foodLogController.js";
import { attachUserIfPresent } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", attachUserIfPresent, getFoodLogs);
router.post("/", attachUserIfPresent, createFoodLog);
router.get("/:id", getFoodLogById);
router.delete("/:id", deleteFoodLog);

export default router;
