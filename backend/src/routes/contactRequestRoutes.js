import { Router } from "express";
import {
  createContactRequest,
  getContactRequests,
  updateContactRequestStatus,
} from "../controllers/contactRequestController.js";
import { attachUserIfPresent } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", getContactRequests);
router.post("/", attachUserIfPresent, createContactRequest);
router.patch("/:id/status", updateContactRequestStatus);

export default router;
