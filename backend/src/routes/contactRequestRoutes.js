import { Router } from "express";
import {
  createContactRequest,
  getContactRequests,
  updateContactRequestStatus,
} from "../controllers/contactRequestController.js";
import { attachUserIfPresent, protect, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

// Public read (filtered by query param ngo/donor) and creation
router.get("/", getContactRequests);
router.post("/", attachUserIfPresent, createContactRequest);
// Only authenticated NGOs may update the status of a contact request directed at them
router.patch("/:id/status", protect, requireRole("ngo"), updateContactRequestStatus);

export default router;
