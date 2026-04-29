import { Router } from "express";
import { createNGO, getNGOById, getNGOs, updateNGO } from "../controllers/ngoController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public reads — used by Contact NGOs map page
router.get("/", getNGOs);
router.get("/:id", getNGOById);
// Mutations require authentication to prevent fake NGO injection
router.post("/", protect, createNGO);
router.patch("/:id", protect, updateNGO);

export default router;
