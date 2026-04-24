import { Router } from "express";
import {
  getIndividualWaste,
  getOverview,
  getWasteDaily,
  getWasteMonthly,
  getWasteWeekly,
} from "../controllers/analyticsController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/overview", getOverview);
router.get("/waste/daily", protect, requireRole("restaurant"), getWasteDaily);
router.get("/waste/weekly", protect, requireRole("restaurant"), getWasteWeekly);
router.get("/waste/monthly", protect, requireRole("restaurant"), getWasteMonthly);
router.get("/waste/individual", protect, requireRole("individual"), getIndividualWaste);

export default router;
