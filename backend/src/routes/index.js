import { Router } from "express";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from "./authRoutes.js";
import { logClientDebug } from "../controllers/debugController.js";
import contactRequestRoutes from "./contactRequestRoutes.js";
import donationRoutes from "./donationRoutes.js";
import foodLogRoutes from "./foodLogRoutes.js";
import impactStoryRoutes from "./impactStoryRoutes.js";
import ngoRoutes from "./ngoRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "bhojan-setu-api",
    timestamp: new Date().toISOString(),
  });
});

router.post("/debug/client-log", logClientDebug);

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/food-logs", foodLogRoutes);
router.use("/donations", donationRoutes);
router.use("/ngos", ngoRoutes);
router.use("/contact-requests", contactRequestRoutes);
router.use("/impact-stories", impactStoryRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
